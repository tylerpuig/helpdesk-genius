import fs from 'fs/promises'
import { db } from './dbInstance.mjs'
import * as schema from '../src/server/db/schema.js'
import dotenv from 'dotenv'
import path from 'path'
import OpenAI from 'openai'

dotenv.config({
  path: '../.env'
})

const WORKSPACE_ID = process.env.WORKSPACE_ID!
const defaultAgents: { title: string; description: string; filename: string }[] = [
  {
    title: 'Technical Tom',
    description: 'Tom deals with technical support issues.',
    filename: 'technical.txt'
  },
  {
    title: 'Billing Betty',
    description:
      'Betty assists with billing inquiries, payment issues, and subscription management.',
    filename: 'billing.txt'
  },
  {
    title: 'Sales Steve',
    description: 'Steve handles sales inquiries, product demos, and pricing details.',
    filename: 'sales.txt'
  },
  {
    title: 'Onboarding Olivia',
    description: 'Olivia helps new users set up their accounts and get started with the platform.',
    filename: 'onboarding.txt'
  },
  {
    title: 'Account Adam',
    description:
      'Adam manages account-related questions, including profile updates and user permissions.',
    filename: 'account.txt'
  },
  {
    title: 'Security Sarah',
    description: 'Sarah addresses security concerns, access permissions, and account recovery.',
    filename: 'security.txt'
  },
  {
    title: 'Gerald Greeter',
    description: 'Gerald deals with greeting users for our website',
    filename: 'greeting.txt'
  }
]

async function createAgentsWithKnowlege() {
  try {
    for (const agent of defaultAgents) {
      const filePath = path.join('..', 'scripts', 'knowledge', agent.filename)
      const fileContent = await fs.readFile(filePath, 'utf8')
      const sections = fileContent
        .split('=====')
        .map((section) => {
          // Remove extra whitespace, newlines, and carriage returns
          return section
            .trim()
            .replace(/\r\n/g, '\n') // Convert CRLF to LF
            .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
            .replace(/^\s+|\s+$/g, '') // Remove leading/trailing whitespace
        })
        .filter(Boolean)

      //   console.log(sections)

      const [newAgent] = await db
        .insert(schema.agentsTable)
        .values({
          title: agent.title,
          description: agent.description,
          workspaceId: WORKSPACE_ID
        })
        .returning()
      if (!newAgent) {
        console.error('Failed to create agent', agent.title)
        continue
      }

      for (const knowledge of sections) {
        await insertKnowledgeToAgent(newAgent.id, knowledge)
      }
    }
  } catch (err) {
    console.error(err)
  }
}
// createAgentsWithKnowlege()

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generateEmbeddingFromText(text: string): Promise<number[] | undefined> {
  try {
    const response = await openaiClient.embeddings.create({
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

async function insertKnowledgeToAgent(agentId: string, knowledge: string) {
  try {
    await db.insert(schema.knowledgeBaseEmbeddingsTable).values({
      agentId,
      rawContent: knowledge,
      embedding: await generateEmbeddingFromText(knowledge),
      rawContentSummary: await getKnowledgeSummary(knowledge)
    })
  } catch (error) {
    console.error(error)
  }
}

async function getKnowledgeSummary(knowledge: string) {
  try {
    const response = await openaiClient.chat.completions.create({
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
