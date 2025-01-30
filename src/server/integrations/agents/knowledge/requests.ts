import { openai } from '~/server/integrations/openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { type EnabledAgentData } from '~/server/db/utils/queries'
import {
  findSimilarMessagesFromAgentKnowledge,
  getPreviousThreadContext
} from '~/server/db/utils/queries'
import { type AgentThreadState } from '~/server/integrations/agents/knowledge/router'
import { generateEmbeddingFromText } from '~/server/integrations/openai'

const suggestAgentOuputSchema = z.object({
  agentIds: z.array(z.string())
})

export async function getSuggestedAgentsFromMessageContent(
  previousMessages: string,
  agents: EnabledAgentData[]
): Promise<string[]> {
  try {
    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that selects the best agents for a given message. Your task is to suggest the relevant agents based on the message content. You should provide the agent IDs as an array in your response. If there are no relevant agents, return an empty array.

          You may also return these strings in the array:
          - scheduler: For scheduling meetings or demo requests
          - greeter: For initial greetings and welcome messages

          Agents:
          ${agents.map((agent) => `- Title: ${agent.title}; Description: ${agent.description}; ID: ${agent.id}`).join('\n')}

          Example: User is asking about a meeting or demo request.
          Response: ["scheduler"]

          Example: User answered a question in response to a previous message regarding a meeting.
          Response: ["scheduler"]

          Example: User wants to schedule a meeting with a specific date and time AND they need help with billing. Note that <agent-id-for-billing> is an example, you need to provide the actual agent ID from the list above.

          Response: ["scheduler", "<agent-id-for-billing>"]

          Example: User does not send a message related to any of the agents.
          Response: ['greeter']

          `
        },
        {
          role: 'user',
          content: `Messages: ${previousMessages}`
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

const responseToUserMessageSchema = z.object({
  message: z.string()
})
export async function respondToUserMessage(
  state: AgentThreadState,
  agentId: string
): Promise<string> {
  try {
    const embedding = await generateEmbeddingFromText(
      state.messages.map((message) => message.content).join('\n')
    )

    if (!embedding) {
      return ''
    }
    const similarKnowledge = await findSimilarMessagesFromAgentKnowledge(agentId, embedding)

    const previousThreadMessages = await getPreviousThreadContext(state.agentParams.threadId, 3)

    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that generates a reply to a user's message. Your task is to generate a reply that is relevant to the message using the same tone and language as the similar messages provided to you. Use the knowledge provided to guide your reply. You should only generate one reply, and you should provide the reply ONLY as your response.
              
              Knowledge to refer to:
              ${JSON.stringify(similarKnowledge, null, 2)}
    
              You can refer to the previous messages for a better understanding of the context. The "customer" role is who you are replying to. The "agent" role contains messages from our organization. The previous messages are:
              ${(previousThreadMessages ?? []).join('\n')}
            `
        },
        {
          role: 'user',
          content: `Message: ${state.messages.map((message) => message.content).join('\n')}`
        }
      ],
      response_format: zodResponseFormat(responseToUserMessageSchema, 'message')
    })

    return response?.choices?.[0]?.message?.parsed?.message ?? ''
  } catch (err) {
    console.error('generateAgentKnowledgeSummary', err)
  }

  return ''
}
