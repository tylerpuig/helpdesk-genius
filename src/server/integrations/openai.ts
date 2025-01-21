import OpenAI from 'openai'
import { z } from 'zod'
import { db } from '~/server/db'
import * as schema from '~/server/db/schema'
import { asc, eq, and, desc } from 'drizzle-orm'
import { faker } from '@faker-js/faker'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateEmailMessageReply(messageId: string) {
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

    const newMessageContent = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are replying to an email. Write a realistic, brief email in response to the email below. Don't include any placeholders, instead you can come up with a fake signature.`
        },
        {
          role: 'user',
          content: `Write the email reply to: ${previousMessage.content}`
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
  } catch (error) {
    console.error(error)
  }
}
