import { db } from '~/server/db'
import * as schema from '~/server/db/schema'
import { and, eq, desc, asc, sql } from 'drizzle-orm'

export type DefaultAgentFunction = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any> // JSON Schema
    required: string[]
    embeddings: Array<{ context: string }>
  }
}

type DefaultAgent = {
  title: string
  description: string
  functions: DefaultAgentFunction[]
}

export const DEFAULT_AGENTS: DefaultAgent[] = [
  {
    title: 'Calendar Manager',
    description: 'Manages calendar events and meetings',
    functions: [
      {
        type: 'function',
        function: {
          name: 'createMeeting',
          description: 'Create a new meeting',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              duration: { type: 'integer', minimum: 15 }
            }
          },
          required: ['title', 'startTime', 'duration'],
          embeddings: [
            { context: 'Create a new meeting or calendar event' },
            { context: 'Schedule a meeting with participants' }
          ]
        }
      }
    ]
  }
  // Add more default agents...
]

export async function createWorkspaceWithDefaultAgents(workspaceData: WorkspaceCreateInput) {
  const workspace = await db.transaction(async (tx) => {
    // Insert default agents
    const agentInserts = DEFAULT_AGENTS.map((agent) => ({
      workspaceId: workspace[0].id,
      title: agent.title,
      description: agent.description,
      isCustom: false,
      enabled: true,
      allowAutoReply: true
    }))

    const agents = await tx.insert(agentsTable).values(agentInserts).returning()

    // Insert functions and embeddings for each agent
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i]
      const defaultAgent = DEFAULT_AGENTS[i]

      const functionInserts = defaultAgent.functions.map((fn) => ({
        agentId: agent.id,
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
        required: fn.required
      }))

      const functions = await tx.insert(agentFunctionsTable).values(functionInserts).returning()

      // Insert embeddings
      for (let j = 0; j < functions.length; j++) {
        const fn = functions[j]
        const defaultFn = defaultAgent.functions[j]

        const embeddings = await Promise.all(
          defaultFn.embeddings.map(async (e) => {
            const embedding = await generateEmbedding(e.context) // Your embedding generation function
            return {
              functionId: fn.id,
              embedding,
              context: e.context
            }
          })
        )

        await tx.insert(functionEmbeddingsTable).values(embeddings)
      }
    }

    return workspace[0]
  })

  return workspace
}
