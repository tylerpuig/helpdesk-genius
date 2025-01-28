import { chatEE, type EventEmitterChatMessage } from '~/server/api/routers/chat'
import { db } from '~/server/db'
import { eq } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as dbQueryUtils from '~/server/db/utils/queries'
import * as openaiUtils from '~/server/integrations/openai'
import * as dbInsertionUtils from '~/server/db/utils/insertions'
import * as dbFunctionUtils from '~/server/integrations/agents/functions/queries'
import * as openaiFunctionUtils from '~/server/integrations/agents/functions/openaiUtils'
import { getAgentFunctionHandler } from '~/server/integrations/agents/functions/functionRegistry'

export async function handleAgentAutoReply(
  workspaceId: string,
  threadId: string,
  messageContent: string
) {
  try {
    const agents = await dbQueryUtils.getEnabledAgentsForWorkspace(workspaceId)
    if (!agents?.length) {
      return
    }

    console.log('agents', agents)

    const suggestedAgentIds = await openaiUtils.suggestAgentsFromMessageContent(
      messageContent,
      agents
    )

    if (!suggestedAgentIds.length) {
      return
    }

    for (const suggestedAgentId of suggestedAgentIds) {
      const agent = await db.query.agentsTable.findFirst({
        where: eq(schema.agentsTable.id, suggestedAgentId)
      })

      if (!agent) {
        continue
      }

      if (agent.isCustom) {
        const messageEmbedding = await openaiUtils.generateEmbeddingFromText(messageContent)
        if (!messageEmbedding) {
          return
        }

        const similarMessages = await dbQueryUtils.findSimilarMessagesFromAgentKnowledge(
          suggestedAgentId,
          messageEmbedding
        )

        // console.log(similarMessages)

        if (!similarMessages?.length) {
          return
        }

        // get last 3 messages from thread
        const previousThreadMessages = await dbQueryUtils.getPreviousThreadContext(threadId, 3)
        // console.log('previousThreadMessages', previousThreadMessages)

        const replyInfo = await openaiUtils.generateAutoReplyMessage(
          messageContent,
          similarMessages.map((message) => message.content).join('\n\n'),
          previousThreadMessages ?? []
        )
        console.log('autoReply', replyInfo)

        if (!replyInfo?.autoReply) {
          return
        }

        // create the new message
        await dbInsertionUtils.createNewAutoReplyChatMessage(
          threadId,
          replyInfo.autoReply,
          suggestedAgentId
        )

        // emit
        const subMessage: EventEmitterChatMessage = {
          notificationType: 'NEW_MESSAGE'
        }
        chatEE.emit('newMessage', subMessage)

        const knowledgeRawContent = JSON.stringify(replyInfo)
        const previousMessageContent = (previousThreadMessages ?? []).map((message) => {
          return `message: ${message.content} name: ${message.senderName} email: ${message.senderEmail} role: ${message.role} \n`
        })

        const knowledgeEmbeddingContent = `
    ${knowledgeRawContent}

    ${previousMessageContent.join('\n')}
    `

        // add to agent knowledge
        await dbInsertionUtils.createKnowledgeFromAutoReply(
          suggestedAgentId,
          JSON.stringify(replyInfo),
          knowledgeEmbeddingContent
        )
      } else {
        // Handle default agent with function calling
        const messageEmbedding = await openaiUtils.generateEmbeddingFromText(messageContent)
        if (!messageEmbedding) continue

        // Find the most relevant function
        const functionInfo = await dbFunctionUtils.getMostRelevantFunctionSchema(
          suggestedAgentId,
          messageEmbedding
        )
        console.log('functionInfo', functionInfo)
        if (!functionInfo) continue

        // Use OpenAI to extract parameters
        const functionParameters = await openaiFunctionUtils.extractFunctionParameters(
          messageContent,
          functionInfo.functionToCall
        )

        console.log('functionParameters', functionParameters)

        if (!functionParameters) continue

        const functionHandler = getAgentFunctionHandler(functionInfo.functionName)
        if (!functionHandler) continue

        // Execute the function parametes
        const handlerSuccess = await functionHandler(workspaceId, functionParameters)

        if (!handlerSuccess) continue

        // Generate a user-friendly response
        const functionExecutionHumanReadableResponse =
          await openaiFunctionUtils.generateReadableResponseForFunctionResult(messageContent, {
            functionName: functionInfo.functionName,
            parameters: functionParameters
          })

        console.log(
          'functionExecutionHumanReadableResponse',
          functionExecutionHumanReadableResponse
        )

        if (!functionExecutionHumanReadableResponse) continue

        // Create and emit the response
        // await dbInsertionUtils.createNewAutoReplyChatMessage(
        //   threadId,
        //   functionExecutionHumanReadableResponse,
        //   suggestedAgentId
        // )

        // const subMessage: EventEmitterChatMessage = {
        //   notificationType: 'NEW_MESSAGE'
        // }
        // chatEE.emit('newMessage', subMessage)
      }
    }

    // console.log('autoReply', autoReply)
  } catch (error) {
    console.error('handleAgentAutoReply', error)
  }
}
