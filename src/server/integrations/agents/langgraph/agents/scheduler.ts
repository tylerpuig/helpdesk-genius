import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import {
  type AgentThreadState,
  type AgentParams,
  model
} from '~/server/integrations/agents/langgraph/router'
import { getMessageContent } from '~/server/integrations/agents/langgraph/utils'

export type CalendarCreateEventParams = {
  title?: string
  startTime?: string
  endTime?: string
  duration?: number
  description?: string
}

async function extractDateTimeFromMessage(message: string) {
  const response = await model.invoke([
    new SystemMessage(`Extract meeting time information from the message.
      Return JSON: {
        "startTime": "ISO string",
        "endTime": "ISO string",
        "duration": "number in minutes"
      }`),
    new HumanMessage(message)
  ])

  try {
    const content = getMessageContent(response)
    return JSON.parse(content) as { startTime: string; endTime: string; duration: number } | null
  } catch {
    return null
  }
}

// Modified promptForDateTime
export async function promptForDateTime(
  state: AgentThreadState
): Promise<{ messages: BaseMessage[]; agentParams: AgentParams }> {
  const lastMessage = state.messages[state.messages.length - 1]
  if (!lastMessage) {
    throw new Error('No messages in state')
  }

  const content = getMessageContent(lastMessage)

  // First try to extract datetime from message
  const extracted = await extractDateTimeFromMessage(content)

  if (extracted?.startTime && extracted?.endTime) {
    // If we successfully extracted time, update params but don't ask question
    return {
      messages: state.messages,
      agentParams: {
        scheduling: {
          startTime: extracted.startTime,
          endTime: extracted.endTime,
          duration: extracted.duration
        }
      }
    }
  }

  // If we couldn't extract time, generate question
  const response = await model.invoke([
    new SystemMessage(`You are a helpful scheduling assistant.
      Generate a natural follow-up question asking for the meeting time.
      Suggest they provide both start and end time or duration.
      Example: "What time would you like the meeting? You can specify start/end times or how long you would like to meeting to last."`),
    new HumanMessage(content)
  ])

  const question = new AIMessage({
    content: typeof response.content === 'string' ? response.content : ''
  })

  return {
    messages: [...state.messages, question],
    agentParams: state.agentParams
  }
}
