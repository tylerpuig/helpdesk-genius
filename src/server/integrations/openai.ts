import OpenAI from 'openai'
import { z } from 'zod'
import { db } from '~/server/db'
import * as schema from '~/server/db/schema'
import { asc, eq, and, desc, sql } from 'drizzle-orm'
import { faker } from '@faker-js/faker'

const openai = new OpenAI({
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
    console.error(error)
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
    console.error(error)
  }

  return ''
}
