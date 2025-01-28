import { openai } from '~/server/integrations/openai'
import { type DefaultFunctionData } from '~/server/integrations/agents/functions/functionsSchemas'
import * as FunctionParamTypes from '~/server/integrations/agents/functions/types'

export async function extractFunctionParameters(
  userMessage: string,
  functionData: DefaultFunctionData
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        ...functionData.defaultMessages,
        {
          role: 'user',
          content: userMessage
        }
      ],
      tools: [functionData.functionSchema]
    })

    return JSON.parse(
      response.choices[0]?.message?.tool_calls?.[0]?.function?.arguments ?? '{}'
    ) as FunctionParamTypes.DefaultAgentReturnParams
  } catch (error) {
    console.error('extractFunctionParameters', error)
  }
}

export async function generateReadableResponseForFunctionResult(
  userMessage: string,
  // serialized function parameters
  functionInfo: {
    functionName: string
    parameters: FunctionParamTypes.DefaultAgentReturnParams
  }
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant. A user requested an action and it was completed. Generate a natural response confirming the action.
        
        Function executed: ${functionInfo.functionName}
        Result: ${JSON.stringify(functionInfo.parameters)}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    return response.choices[0]?.message?.content
  } catch (error) {
    console.error('generateFunctionResponse', error)
  }
}
