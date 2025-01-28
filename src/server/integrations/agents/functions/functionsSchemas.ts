import type OpenAI from 'openai'
import * as FunctionParamTypes from '~/server/integrations/agents/functions/types'
import * as extraContext from '~/server/integrations/agents/functions/extraContext'

export type DefaultAgentFunctionCategory = 'calendar'
export type DefaultAgentFunctionName = 'createMeeting'

export type DefaultFunctionData = {
  functionSchema: OpenAI.Chat.Completions.ChatCompletionTool
  name: string
  description: string
  defaultMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
}

export const defaultFunctionMap: Record<
  DefaultAgentFunctionCategory,
  Record<DefaultAgentFunctionName, DefaultFunctionData>
> = {
  calendar: {
    createMeeting: {
      functionSchema: {
        type: 'function',
        function: {
          name: 'createMeeting',
          description: 'Create a new meeting',
          parameters: {
            type: 'object',
            required: ['title', 'startTime', 'endTime', 'duration', 'description'],
            properties: {
              title: { type: 'string' },
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              duration: { type: 'integer' },
              description: { type: 'string' }
            },
            additionalProperties: false
          },
          strict: true
        }
      },
      name: 'createMeeting',
      description:
        'Use this function to create a new meeting or event on the calendar. This may be used for meetings, appointments, to book demos, sales meetings, etc.' +
        extraContext.createMeetingEmbeddingContext,
      defaultMessages: [
        {
          role: 'system',
          content: `

          Today's date is "${new Date()}". For your response, you need to format the start time and end time as a date-time string in ISO 8601 format.

          The duration should be in minutes. If there is no duration, return 60 for the duration.

           The title should be a couple words to summarize the meeting. The description should be a sentence or two to describe the purpose of the meeting.
          `
        }
      ]
    }
  }
}
