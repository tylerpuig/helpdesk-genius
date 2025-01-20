import { db } from './dbInstance.mjs'
import OpenAI from 'openai'
import { eq } from 'drizzle-orm'
import { contacts, messagesTable, threadsTable } from '../src/server/db/schema'
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

async function createContact(customer: (typeof sampleCustomers)[0]) {
  return await db
    .insert(contacts)
    .values({
      name: customer.name,
      email: customer.email,
      company: customer.company
    })
    .returning()
}

async function generateConversation(contact: typeof contacts.$inferSelect) {
  const topic = topics[Math.floor(Math.random() * topics.length)]

  // Create thread
  const [thread] = await db
    .insert(threadsTable)
    .values({
      title: `${contact.name} - ${topic}`,
      status: 'open',
      priority: Math.random() > 0.7 ? 'high' : 'low'
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
  await db.insert(messagesTable).values({
    threadId: thread.id,
    channel: 'email',
    content: initialMessage.choices[0].message.content ?? '',
    senderEmail: contact.email,
    senderName: contact.name,
    role: 'customer',
    createdAt: messageDate
  })

  // update the thread with the latest message date
  await db
    .update(threadsTable)
    .set({ lastMessageAt: messageDate })
    .where(eq(threadsTable.id, thread.id))

  // Generate 1-3 follow-up messages
  const numFollowups = Math.floor(Math.random() * 3) + 1

  for (let i = 0; i < numFollowups; i++) {
    const isCustomer = i % 2 === 0

    const followupMessage = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
    await db.insert(messagesTable).values({
      threadId: thread.id,
      channel: 'email',
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
      const [contact] = await createContact(customer)

      // Generate 1-3 conversations for each contact
      const numConversations = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < numConversations; i++) {
        await generateConversation(contact)
      }
    }

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}

// Run the seeder
seedDatabase()
