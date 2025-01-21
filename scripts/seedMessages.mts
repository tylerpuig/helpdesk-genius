import { db } from './dbInstance.mjs'
import OpenAI from 'openai'
import { eq } from 'drizzle-orm'
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
      .insert(schema.contacts)
      .values({
        name: customer.name,
        email: customer.email,
        company: customer.company
      })
      .returning()
      .onConflictDoNothing()

    return contact
  } catch (error) {
    console.error('createContact', error)
  }
}

async function generateConversationWithFollowups(contact: typeof schema.contacts.$inferSelect) {
  const topic = topics[Math.floor(Math.random() * topics.length)]

  // Create thread
  const [thread] = await db
    .insert(schema.threadsTable)
    .values({
      title: `${contact.name} - ${topic}`,
      status: 'open',
      priority: Math.random() > 0.7 ? 'high' : 'low',
      channel: 'email'
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
    const contacts = await db.select().from(schema.contacts)
    return contacts
  } catch (error) {
    console.error('getAllContact', error)
  }
}

generateNewThreads(3)

async function generateNewThreads(amount: number) {
  try {
    let iterations: number = amount
    let currentContacts = await getAllContacts()
    if (!currentContacts?.length) {
      await createContacts()
      currentContacts = await getAllContacts()
    }

    if (!currentContacts?.length) {
      console.log('No contacts found after inserting')
      return
    }

    for (const randomContact of currentContacts) {
      if (!iterations) break

      const topic = topics[Math.floor(Math.random() * topics.length)]
      // const randomContact = currentContacts[Math.floor(Math.random() * currentContacts.length)]

      // Create thread
      const [thread] = await db
        .insert(schema.threadsTable)
        .values({
          title: `${randomContact.name} - ${topic}`,
          status: 'open',
          priority: Math.random() > 0.7 ? 'high' : 'low',
          channel: 'email'
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
            content: `Write an initial email about: ${topic}`
          }
        ]
      })

      console.log(newMessage.choices[0].message.content)

      const messageDate = new Date()
      // Save the customer's message
      await db.insert(schema.messagesTable).values({
        threadId: thread.id,
        content: newMessage.choices[0].message.content ?? '',
        senderEmail: randomContact.email,
        senderName: randomContact.name,
        role: 'customer',
        createdAt: messageDate
      })

      // update the thread with the latest message date
      await db
        .update(schema.threadsTable)
        .set({ lastMessageAt: messageDate })
        .where(eq(schema.threadsTable.id, thread.id))

      iterations--
    }
  } catch (error) {
    console.error('generateNewThreads', error)
  }
}
