import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config({
  path: '../.env'
})

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

type DefaultFunctionData = {
  functionSchema: OpenAI.Chat.Completions.ChatCompletionTool
  name: string
  context: string
  prompt: string
  defaultMessages: OpenAI.Chat.Completions.ChatCompletionMessage[]
}

const functions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createMeeting',
      description: 'Create a new meeting',
      parameters: {
        type: 'object',
        required: ['title', 'startTime', 'endTime', 'duration'],
        properties: {
          title: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          duration: { type: 'integer' }
        },
        additionalProperties: false
      },
      strict: true
    }
  }
]

export async function testFunctionParameters(userMessage: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `

          Today's date is "${new Date()}". For your response, you need to format the start time and end time as a date-time string in ISO 8601 format.

          The duration should be in minutes. If there is no duration, return 60 for the duration.
          `
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      tools: [functions[0]]
    })

    console.dir(
      JSON.parse(response.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{}'),
      { depth: null }
    )
  } catch (error) {
    console.error('extractFunctionParameters', error)
    return null
  }
}

testFunctionParameters('Create a new meeting for the next week at 10am for 1 hour')
// console.log(new Date().toISOString())
