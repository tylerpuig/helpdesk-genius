import { chatEE } from '~/server/api/routers/chat'
import * as dbQueryUtils from '~/server/db/utils/queries'
import * as openaiUtils from '~/server/integrations/openai'

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

    const suggestedAgentId = await openaiUtils.suggestAgentFromMessageContent(
      messageContent,
      agents
    )

    if (!suggestedAgentId) {
      return
    }

    const messageEmbedding = await openaiUtils.generateEmbeddingFromText(messageContent)
    if (!messageEmbedding) {
      return
    }

    const similarMessages = await dbQueryUtils.findSimilarMessagesFromAgentKnowledge(
      suggestedAgentId,
      messageEmbedding
    )

    console.log(similarMessages)

    if (!similarMessages?.length) {
      return
    }

    const previousThreadMessages = await dbQueryUtils.getPreviousThreadContext(threadId)
    console.log('previousThreadMessages', previousThreadMessages)

    const autoReply = await openaiUtils.generateAutoReplyMessage(
      messageContent,
      similarMessages.map((message) => message.content).join('\n\n'),
      previousThreadMessages ?? []
    )
    console.log('autoReply', autoReply)

    if (!autoReply) {
      return
    }

    // console.log('autoReply', autoReply)
  } catch (error) {
    console.error('handleAgentAutoReply', error)
  }
}
