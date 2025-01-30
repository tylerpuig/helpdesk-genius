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
  agents: EnabledAgentData[],
  state: AgentThreadState
): Promise<string[]> {
  console.log('previousMessages', previousMessages)
  console.log('agents', agents)

  try {
    let latestMessage = ''
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const message = state.messages[i]
      if (!message) continue
      if (message.getType() === 'human') {
        latestMessage = Array.isArray(message.content)
          ? message.content.join('\n')
          : message.content
        break
      }
    }
    // const latestMessageContent = latestMessage?.content ?? ''
    console.log('latestMessage: ', latestMessage)
    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that selects the best agents for a given message. Your task is to suggest the relevant agents based on the message content. You should provide the agent IDs as an array in your response. If there are no relevant agents, return an empty array. Keep the previous messages in consideration for your choices, but ultimately return the agent IDs for the latest message from the user.

            You may also return these strings in the array:
            default agents (use the name for response):
            - scheduler: For scheduling meetings or demo requests
            - greeter: For initial greetings and welcome messages
      
            If the agent is a default agent, respond with just the agent name, nothing else.
            If the agent is a custom agent, respond with the agent id, nothing else.

            If the user is talking about a meeting, respond with "scheduler"
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

const greeterReplySchema = z.object({
  message: z.string()
})

export async function generateGreetingMessage(state: AgentThreadState): Promise<string> {
  try {
    const previousThreadMessages = await getPreviousThreadContext(state.agentParams.threadId, 3)

    const userMessage = state.messages.at(-1)?.content ?? ''

    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful customer support assistant. You will be given a user message and you will respond with a response that is relevant to the user's message. You should only respond with the response, nothing else. If the user is greeting you, respond with a friendly greeting.

          Here is the conversation history: ${JSON.stringify(previousThreadMessages, null, 2)}
    
    `
        },
        {
          role: 'user',
          content: `Message: ${userMessage}`
        }
      ],
      response_format: zodResponseFormat(greeterReplySchema, 'message')
    })

    return response?.choices?.[0]?.message?.parsed?.message ?? ''
  } catch (error) {
    console.error('generateGreetingMessage', error)
  }

  return ''
}

const calendarEventSchema = z.object({
  title: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  description: z.string().optional()
})

const openAiCalendarEventSchema = z.object({
  event: calendarEventSchema,
  response: z.string()
})
export type CalendarCreateEventParams = z.infer<typeof calendarEventSchema>

export async function tryGetCalendarEventFromMessage(state: AgentThreadState) {
  try {
    for (const message of state.messages) {
      Array.isArray(message.content) ? message.content.join('\n') : message.content
    }

    const messageHistoryWithRoles = state.messages
      .map((message) => {
        return `
      message: ${message.content} 
      from: ${message.getType() === 'ai' ? 'agent' : 'customer'}
      `
      })
      .join('\n')

    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Based on the previous messages, extract the meeting details from the user's messages. If the user is asking for a meeting, respond with a JSON object containing the title, start time, end time, duration, and description as part of your response. If the user is not asking for a meeting or not responding to a previous meeting question, return an empty JSON object.

          Here is the conversation history: ${messageHistoryWithRoles}

          Next, add a response message as well. This message can be telling the user you scheduled the event, or you need more information from them. If you need more information to complete the whole event object, ask the user a question to get the missing information. When asking for the information, write it in a simple and concise way. If no duration is provided, assume it is 1 hour.

          title: the title of the meeting in a couple of words. Try to fill this out on your own rather than asking the user for it.
          description: a description of the meeting. Try to fill this out on your own rather than asking the user for it. If there is no context available for the meeting, ask them what they want to discuss.
          startTime: ISO 8601 string. Ask the user for the date, not the exact ISO format.
          endTime: ISO 8601 string Ask the user for the date, not the exact ISO format.
          duration: number in minutes. If no duration is provided, assume it is 1 hour.

          Current Date: ${new Date().toISOString()}

          Example:
          User asks: "I would like to schedule a demo for tomorrow at 10am. Can you help me schedule it?"
          Event:
          {
            "title": "Demo",
            "description": "Demo for tomorrow",
            "startTime": "2025-30-01T10:00:00.000Z",
            "endTime": "2025-30-01T11:00:00.000Z",
            "duration": 60
          }

          Reponse:
          I have scheduled the demo for tomorrow at 10am. Let me know if you need anything else!

          Example:
          User asks: "Hey, I would like to schedule a meeting / demo
          Event:
          {}
          Reponse:
          Great! I'll need some more information from you. What would you like to discuss and what time works best for you?
    
    `
        },
        {
          role: 'user',
          content: `Message: ${state.messages.map((message) => message.content).join('\n')}`
        }
      ],
      response_format: zodResponseFormat(openAiCalendarEventSchema, 'details')
    })

    const event = response?.choices?.[0]?.message?.parsed?.event ?? {}
    const responseContent = response?.choices?.[0]?.message?.parsed?.response ?? ''

    return { event, responseContent }
  } catch (err) {
    console.error('tryGetCalendarEventFromMessage', err)
  }

  return { event: {}, responseContent: '' }
}
