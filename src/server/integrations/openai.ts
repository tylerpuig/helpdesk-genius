import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { db } from '~/server/db'
import * as schema from '~/server/db/schema'
import { asc, eq, and, desc, sql } from 'drizzle-orm'
import { faker } from '@faker-js/faker'
import type { EnabledAgentData, PreviousThreadContext } from '~/server/db/utils/queries'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateEmailMessageReply(messageId: string, threadId: string) {
  try {
    const previousMessage = await db.query.messagesTable.findFirst({
      where: and(eq(schema.messagesTable.id, messageId)),
      orderBy: desc(schema.messagesTable.createdAt)
    })

    let customerEmail = ''
    let customerName = ''

    const previousMessageFromCustomer = await db.query.messagesTable.findFirst({
      where: eq(schema.messagesTable.role, 'customer'),
      orderBy: desc(schema.messagesTable.createdAt)
    })

    if (!previousMessageFromCustomer) {
      customerEmail = faker.internet.email()
      customerName = faker.person.fullName()
    } else {
      customerEmail = previousMessageFromCustomer.senderEmail
      customerName = previousMessageFromCustomer.senderName ?? ''
    }

    if (!previousMessage) {
      throw new Error('No previous message found')
    }

    const allConversationHistory = await db.query.messagesTable.findMany({
      where: and(eq(schema.messagesTable.threadId, previousMessage.threadId)),
      columns: {
        content: true,
        createdAt: true,
        senderName: true,
        role: true
      },
      orderBy: asc(schema.messagesTable.createdAt)
    })

    const newMessageContent = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are replying to an email. Write a realistic, brief email in response to the email below. Don't include any placeholders, instead you can come up with a fake signature.`
        },
        {
          role: 'user',
          content: `Write the email reply to: ${previousMessage.content}. You are simulating ${customerName}.`
        },
        {
          role: 'user',
          content: `Here is the conversation history: ${JSON.stringify(allConversationHistory, null, 2)}`
        }
      ]
    })

    const replyContent = newMessageContent.choices?.[0]?.message.content ?? ''
    console.log('generated replyContent', replyContent)

    const messageDate = new Date()
    // Save the customer's message
    await db.insert(schema.messagesTable).values({
      threadId: previousMessage.threadId,
      content: replyContent,
      senderEmail: customerEmail,
      senderName: customerName,
      role: 'customer',
      createdAt: messageDate
    })

    // update the thread with the latest message date
    await db
      .update(schema.threadsTable)
      .set({ lastMessageAt: messageDate })
      .where(eq(schema.threadsTable.id, previousMessage.threadId))

    await db
      .update(schema.threadsTable)
      .set({
        messageCount: sql`${schema.threadsTable.messageCount} + 1`,
        customerMessageCount: sql`${schema.threadsTable.customerMessageCount} + 1`
      })
      .where(eq(schema.threadsTable.id, threadId))
  } catch (error) {
    console.error(error)
  }
}

export async function generateChatThreadTitle(message: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You need to come up with a title for a chat thread. The title should be short and concise. Don't include any placeholders, instead you can come up with a fake signature. Do not include a personal name with the title.`
        },
        {
          role: 'user',
          content: `Write title for: ${message}`
        }
      ]
    })

    const title = response?.choices?.[0]?.message?.content ?? ''
    return title
  } catch (error) {
    console.error(error)
  }

  return ''
}

export async function generateContactSummary(contactEmail: string, messages: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a customer support agent. Summarize the last 15 messages sent to ${contactEmail}.`
        },
        {
          role: 'user',
          content: `Summarize theses messages ${messages}. Don't mention the quantity of messages. Make it less than 100 words.`
        }
      ]
    })

    const summary = response?.choices?.[0]?.message?.content ?? ''
    return summary
  } catch (error) {
    console.error(error)
  }

  return ''
}

export async function generateEmbeddingFromText(text: string): Promise<number[] | undefined> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536
    })

    const embedding = response?.data?.[0]?.embedding ?? []
    return embedding
  } catch (error) {
    console.error('generateEmbeddingFromText', error)
  }

  return []
}

export async function generateAgentKnowledgeSummary(knowledge: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Summarize the following knowledge for an agent. Must be less than 10 words.`
        },
        {
          role: 'user',
          content: `Summarize this knowledge: ${knowledge}`
        }
      ]
    })

    const summary = response?.choices?.[0]?.message?.content ?? ''
    return summary
  } catch (error) {
    console.error('generateAgentKnowledgeSummary', error)
  }

  return ''
}

export async function generateEmailContextSummary(context: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Based on the previous messages, summarize the content of the emails and of the response provided. Keep it less than 50 words. Try to be descriptive and use words / phrases so we can look them up later to use for our knowledge base and for future emails.`
        },
        {
          role: 'user',
          content: `Summarize this: ${context}`
        }
      ]
    })

    const summary = response?.choices?.[0]?.message?.content ?? ''
    return summary
  } catch (error) {
    console.error('generateAgentKnowledgeSummary', error)
  }

  return ''
}

const suggestAgentOuputSchema = z.object({
  agentIds: z.array(z.string())
})

export async function suggestAgentsFromMessageContent(
  message: string,
  agents: NonNullable<EnabledAgentData>
): Promise<string[]> {
  try {
    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that selects the best agents for a given message. Your task is to suggest the relevant agents based on the message content. You should provide the agent IDs as an array in your response. If there are no relevant agents, return an empty array.
          
          Agents:
          ${agents.map((agent) => `- Title: ${agent.title}; Description: ${agent.description}; ID: ${agent.id}`).join('\n')}
          `
        },
        {
          role: 'user',
          content: `Message: ${message}`
        }
      ],
      response_format: zodResponseFormat(suggestAgentOuputSchema, 'agents')
    })

    return response?.choices?.[0]?.message?.parsed?.agentIds ?? []
  } catch (error) {
    console.error('suggestAgentFromMessageContent', error)
    return []
  }
}

const generatedAutoReplyMessageSchema = z.object({
  autoReply: z.string(),
  responseContext: z.string()
})

export async function generateAutoReplyMessage(
  originalMessage: string,
  similarKnowledgeContent: string,
  previousThreadMessages: PreviousThreadContext
) {
  try {
    const previousMessageContent = previousThreadMessages.map((message) => {
      return `message: ${message.content} name: ${message.senderName} email: ${message.senderEmail} role: ${message.role} \n`
    })
    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that generates a reply to a user's message. Your task is to generate a reply that is relevant to the message using the same tone and language as the similar messages provided to you. Use the knowledge provided to guide your reply. You should only generate one reply, and you should provide the reply ONLY as your response. You should also provide a response context that provides additional context to the reply so that our knowledge base can expand from the message context. The response context should include relevant information from the original message and the similar knowledge so that we can refer to it later if a user asks a similar question. For the response context, basically explain your reasoning for the reply based on the similar and previous messages. Do not use placeholders.
          
          Knowledge to refer to:
          ${similarKnowledgeContent}

          You can refer to the previous messages for a better understanding of the context. The "customer" role is who you are replying to. The "agent" role contains messages from our organization. The previous messages are:
          ${previousMessageContent.join('\n')}

          `
        },
        {
          role: 'user',
          content: `Message: ${originalMessage}`
        }
      ],
      response_format: zodResponseFormat(generatedAutoReplyMessageSchema, 'response')
    })

    const responseData = response?.choices?.[0]?.message?.parsed
    return responseData
  } catch (error) {
    console.error('generateAutoReplyMessage', error)
  }
}
