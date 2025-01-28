import { db } from './dbInstance.mjs'
import OpenAI from 'openai'
import { eq, sql, and } from 'drizzle-orm'
import * as schema from '../src/server/db/schema'
import dotenv from 'dotenv'

dotenv.config({
  path: '../.env'
})

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in .env')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const WORKSPACE_ID = process.env.WORKSPACE_ID!

const sampleCustomers = [
  { name: 'John Smith', email: 'john.smith@example.com', company: 'TechCorp' },
  { name: 'Sarah Johnson', email: 'sarah.j@example.com', company: 'InnovateCo' },
  { name: 'Mike Wilson', email: 'mike.w@example.com', company: 'DevLabs' }
]

const topics = [
  'Billing inquiry',
  'Technical support needed',
  'Product feedback',
  'Account access issue',
  'Integration questions'
]

async function createContacts() {
  for (const customer of sampleCustomers) {
    await createContact(customer)
  }
}
async function createContact(customer: (typeof sampleCustomers)[0]) {
  try {
    const [contact] = await db
      .insert(schema.contactsTable)
      .values({
        name: customer.name,
        email: customer.email,
        company: customer.company,
        workspaceId: WORKSPACE_ID
      })
      .returning()
      .onConflictDoNothing()

    return contact
  } catch (error) {
    console.error('createContact', error)
  }
}

async function generateConversationWithFollowups(
  contact: typeof schema.contactsTable.$inferSelect
) {
  const topic = topics[Math.floor(Math.random() * topics.length)]

  // Create thread
  const [thread] = await db
    .insert(schema.threadsTable)
    .values({
      title: `${contact.name} - ${topic}`,
      status: 'open',
      priority: Math.random() > 0.7 ? 'high' : 'low',
      channel: 'email',
      workspaceId: WORKSPACE_ID
    })
    .returning()

  // Generate initial customer message using OpenAI
  const initialMessage = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a customer writing an initial email about a specific topic. Write a realistic, brief email.'
      },
      {
        role: 'user',
        content: `Write an initial email about: ${topic}`
      }
    ]
  })

  console.log(initialMessage.choices[0].message.content)
  const messageDate = new Date()
  // Save the customer's message
  await db.insert(schema.messagesTable).values({
    threadId: thread.id,
    content: initialMessage.choices[0].message.content ?? '',
    senderEmail: contact.email,
    senderName: contact.name,
    role: 'customer',
    createdAt: messageDate
  })

  // update the thread with the latest message date
  await db
    .update(schema.threadsTable)
    .set({ lastMessageAt: messageDate })
    .where(eq(schema.threadsTable.id, thread.id))

  // Generate 1-3 follow-up messages
  const numFollowups = Math.floor(Math.random() * 3) + 1

  for (let i = 0; i < numFollowups; i++) {
    const isCustomer = i % 2 === 0

    const followupMessage = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: isCustomer
            ? 'You are a customer following up on your previous message. Write a brief, realistic follow-up.'
            : 'You are a customer service agent responding to a customer. Write a brief, professional response.'
        },
        {
          role: 'user',
          content: `Write a ${isCustomer ? 'follow-up message' : 'response'} regarding: ${topic}`
        }
      ]
    })

    console.log('followupMessage', followupMessage.choices[0].message.content)
    await db.insert(schema.messagesTable).values({
      threadId: thread.id,
      content: followupMessage.choices[0].message.content || '',
      senderEmail: isCustomer ? contact.email : 'support@company.com',
      senderName: isCustomer ? contact.name : 'Support Team',
      role: isCustomer ? 'customer' : 'agent'
    })

    // Add some random delay between messages
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000))
  }

  return thread
}

async function seedDatabase() {
  try {
    // Create contacts first
    for (const customer of sampleCustomers) {
      const contact = await createContact(customer)
      if (!contact) {
        console.error('Contact creation failed')
        continue
      }

      // Generate 1-3 conversations for each contact
      const numConversations = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < numConversations; i++) {
        await generateConversationWithFollowups(contact)
      }
    }

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}

// Run the seeder
// seedDatabase()
async function getAllContacts() {
  try {
    const contacts = await db.select().from(schema.contactsTable)
    return contacts
  } catch (error) {
    console.error('getAllContact', error)
  }
}

generateNewThreads(10)

async function generateNewThreads(amount: number) {
  try {
    let currentContacts = await getAllContacts()
    if (!currentContacts?.length) {
      await createContacts()
      currentContacts = await getAllContacts()
    }

    if (!currentContacts?.length) {
      console.log('No contacts found after inserting')
      return
    }

    const users = await getAllUsers()
    if (!users) {
      console.log('No users found after inserting')
      return
    }

    for (let i = 0; i < amount; i++) {
      const randomContact = currentContacts[Math.floor(Math.random() * currentContacts.length)]
      // for (const randomContact of currentContacts) {
      const topic = topics[Math.floor(Math.random() * topics.length)]
      // const randomContact = currentContacts[Math.floor(Math.random() * currentContacts.length)]

      const randomDate = new Date()
      // const randInt = Math.floor(Math.random() * 7)
      // randomDate.setDate(randomDate.getDate() - randInt)

      // Create thread
      const [thread] = await db
        .insert(schema.threadsTable)
        .values({
          title: `${randomContact.name} - ${topic}`,
          status: 'open',
          priority: Math.random() > 0.7 ? 'high' : 'low',
          channel: 'email',
          createdAt: randomDate,
          workspaceId: WORKSPACE_ID
        })
        .returning()

      // Generate initial customer message using OpenAI
      const newMessage = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a customer writing an initial email about a specific topic. Write a realistic, brief email. Don't include any placeholders, instead you can come up with a fake signature.`
          },
          {
            role: 'user',
            content: `Write an initial email about: ${topic}
            
            Your name: ${randomContact.name}
            Your email: ${randomContact.email}
            Your company: ${randomContact.company}
            `
          }
        ]
      })

      const messageContent = newMessage.choices[0].message.content ?? ''
      console.log(messageContent)

      // const messageDate = new Date()
      // Save the customer's message
      await db.insert(schema.messagesTable).values({
        threadId: thread.id,
        content: messageContent,
        senderEmail: randomContact.email,
        senderName: randomContact.name,
        role: 'customer',
        createdAt: randomDate
      })

      // update the thread with the latest message date
      await db
        .update(schema.threadsTable)
        .set({ lastMessageAt: randomDate })
        .where(eq(schema.threadsTable.id, thread.id))

      // select a random user to send a reply
      // const randomUser = users[Math.floor(Math.random() * users.length)]
      // if (thread) {
      //   await createNewEmailMessageReply(thread.id, messageContent, WORKSPACE_ID, randomUser.id)

      //   const randInt = Math.floor(Math.random() * 11)
      //   if (randInt < 5) {
      //     await markThreadAsResolved(randomUser.id, thread.id)
      //   }
      // }
      // }
    }
  } catch (error) {
    console.error('generateNewThreads', error)
  }
}

async function getAllUsers() {
  try {
    const users = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true
      }
    })
    return users
  } catch (error) {
    console.error('getAllUsers', error)
  }
}

export async function createNewEmailMessageReply(
  threadId: string,
  messageContent: string,
  workspaceId: string,
  userId: string
) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    })
    const thread = await db.query.threadsTable.findFirst({
      where: eq(schema.threadsTable.id, threadId)
    })

    // Calculate response time in seconds
    const responseTimeInSeconds = thread
      ? Math.floor((Date.now() - thread.createdAt.getTime()) / 1000)
      : undefined

    const messageCreationDate = new Date()

    const [newMessage] = await db
      .insert(schema.messagesTable)
      .values({
        threadId: threadId,
        content: messageContent,
        senderEmail: user?.email ?? '',
        senderName: user?.name ?? '',
        role: 'agent',
        createdAt: messageCreationDate,
        isUnread: false
      })
      .returning({
        id: schema.messagesTable.id
      })

    // Mark thread as read
    await db
      .update(schema.threadsTable)
      .set({ isUnread: false })
      .where(eq(schema.threadsTable.id, threadId))

    if (thread) {
      // update user metrics
      await updateUserMetrics({
        userId: user?.id ?? '',
        threadId: threadId,
        isFirstResponse: thread.agentMessageCount === 0,
        responseTimeInSeconds,
        lastMessageAt: messageCreationDate,
        workspaceId
      })
    }
  } catch (error) {
    console.error('createNewEmailMessageReply', error)
  }
}

type UpdateMetricsParams = {
  userId: string
  threadId: string
  isFirstResponse: boolean
  responseTimeInSeconds?: number
  lastMessageAt: Date
  workspaceId: string
}

export async function updateUserMetrics({
  userId,
  threadId,
  isFirstResponse,
  responseTimeInSeconds,
  lastMessageAt,
  workspaceId
}: UpdateMetricsParams) {
  try {
    const randInt = Math.floor(Math.random() * 8)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    today.setDate(today.getDate() - randInt)

    // Start a transaction to ensure all updates are atomic
    await db.transaction(async (tx) => {
      // 1. Update or create daily metrics
      const dailyMetrics = await tx
        .insert(schema.userDailyMetricsTable)
        .values({
          userId,
          workspaceId,
          date: today,
          responseCount: 1,
          agentMessageCount: 1,
          ...(isFirstResponse && responseTimeInSeconds
            ? {
                averageFirstResponseTime: responseTimeInSeconds
              }
            : {})
        })
        .onConflictDoUpdate({
          target: [
            schema.userDailyMetricsTable.workspaceId,
            schema.userDailyMetricsTable.userId,
            schema.userDailyMetricsTable.date
          ],
          set: {
            responseCount: sql`${schema.userDailyMetricsTable.responseCount} + 1`,
            agentMessageCount: sql`${schema.userDailyMetricsTable.agentMessageCount} + 1`,
            ...(isFirstResponse && responseTimeInSeconds
              ? {
                  averageFirstResponseTime: sql`
                  (${schema.userDailyMetricsTable.averageFirstResponseTime} *
                   ${schema.userDailyMetricsTable.threadsAssigned} + ${responseTimeInSeconds}) /
                  (${schema.userDailyMetricsTable.threadsAssigned} + 1)
                `
                }
              : {}),
            totalResponseTime: sql`${schema.userDailyMetricsTable.totalResponseTime} + ${
              responseTimeInSeconds || 0
            }`
          }
        })
        .returning()

      // 2. Update user's overall stats
      await tx
        .insert(schema.userStatsTable)
        .values({
          workspaceId,
          userId,
          totalAgentMessages: 1,
          lastActiveAt: new Date(),
          ...(isFirstResponse && responseTimeInSeconds
            ? {
                averageFirstResponseTime: responseTimeInSeconds
              }
            : {})
        })
        .onConflictDoUpdate({
          target: [schema.userStatsTable.userId, schema.userStatsTable.workspaceId],
          set: {
            totalAgentMessages: sql`${schema.userStatsTable.totalAgentMessages} + 1`,
            lastActiveAt: new Date(),
            ...(isFirstResponse && responseTimeInSeconds
              ? {
                  averageFirstResponseTime: sql`
            (${schema.userStatsTable.averageFirstResponseTime} *
             ${schema.userStatsTable.totalThreadsHandled} + ${responseTimeInSeconds}) /
            (${schema.userStatsTable.totalThreadsHandled} + 1)
            `
                }
              : {}),
            averageResponseTime: sql`
      (${schema.userStatsTable.averageResponseTime} * ${schema.userStatsTable.totalAgentMessages} + ${
        responseTimeInSeconds || 0
      }) / (${schema.userStatsTable.totalAgentMessages} + 1)
      `
          }
        })

      // 3. Update thread metrics
      await tx
        .update(schema.threadsTable)
        .set({
          messageCount: sql`${schema.threadsTable.messageCount} + 1`,
          agentMessageCount: sql`${schema.threadsTable.agentMessageCount} + 1`,
          lastMessageAt: lastMessageAt,
          ...(isFirstResponse && responseTimeInSeconds
            ? {
                firstResponseTime: responseTimeInSeconds
              }
            : {})
        })
        .where(eq(schema.threadsTable.id, threadId))

      return dailyMetrics
    })
  } catch (error) {
    console.error('updateUserMetrics', error)
  }
}

export async function incrementUserResolvedThread(
  userId: string,
  workspaceId: string
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    await db
      .update(schema.userStatsTable)
      .set({
        totalThreadsResolved: sql`${schema.userStatsTable.totalThreadsResolved} + 1`,
        totalThreadsHandled: sql`${schema.userStatsTable.totalThreadsHandled} + 1`
      })
      .where(
        and(
          eq(schema.userStatsTable.userId, userId),
          eq(schema.userStatsTable.workspaceId, workspaceId)
        )
      )

    await db
      .insert(schema.userDailyMetricsTable)
      .values({
        userId,
        workspaceId,
        date: today,
        threadsResolved: 1
      })
      .onConflictDoUpdate({
        target: [
          schema.userDailyMetricsTable.workspaceId,
          schema.userDailyMetricsTable.userId,
          schema.userDailyMetricsTable.date
        ],
        set: {
          threadsResolved: sql`${schema.userDailyMetricsTable.threadsResolved} + 1`
        }
      })
  } catch (error) {
    console.error('incrementUserResolvedThread', error)
  }
}

async function markThreadAsResolved(userId: string, threadId: string) {
  try {
    await db
      .update(schema.threadsTable)
      .set({ status: 'closed' })
      .where(eq(schema.threadsTable.id, threadId))

    await incrementUserResolvedThread(userId, WORKSPACE_ID)
  } catch (err) {
    console.error(err)
  }
}
