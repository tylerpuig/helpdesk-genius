import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { type CalendarCreateEventParams } from '~/server/integrations/agents/knowledge/requests'

export async function formatInitialMessage(userMessage: string): Promise<BaseMessage[]> {
  return [
    new SystemMessage(`
    You are a helpful assistant. You will be given a user message and you will respond with a response that is relevant to the user's message. You should only respond with the response, nothing else.
    
    `),
    new HumanMessage(userMessage)
  ]
}

export function eventHasRequiredFields(event: CalendarCreateEventParams) {
  return event?.title && event?.startTime && event?.endTime && event?.duration && event?.description
}
