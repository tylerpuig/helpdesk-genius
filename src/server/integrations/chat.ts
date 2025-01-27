import { chatEE, type EventEmitterChatMessage } from '~/server/api/routers/chat'
import * as dbQueryUtils from '~/server/db/utils/queries'
import * as openaiUtils from '~/server/integrations/openai'
import * as dbInsertionUtils from '~/server/db/utils/insertions'

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

    // get last 3 messages from thread
    const previousThreadMessages = await dbQueryUtils.getPreviousThreadContext(threadId, 3)
    console.log('previousThreadMessages', previousThreadMessages)

    const replyInfo = await openaiUtils.generateAutoReplyMessage(
      messageContent,
      similarMessages.map((message) => message.content).join('\n\n'),
      previousThreadMessages ?? []
    )
    console.log('autoReply', replyInfo)

    if (!replyInfo?.autoReply) {
      return
    }

    // get the agent id for the auto reply
    const agentForAutoReply = await openaiUtils.suggestAgentFromMessageContent(
      replyInfo.autoReply,
      agents
    )

    if (!agentForAutoReply) {
      return
    }

    console.log('agentForAutoReply', agentForAutoReply)

    // create the new message
    await dbInsertionUtils.createNewAutoReplyChatMessage(
      threadId,
      replyInfo.autoReply,
      agentForAutoReply
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
      agentForAutoReply,
      JSON.stringify(replyInfo),
      knowledgeEmbeddingContent
    )

    // console.log('autoReply', autoReply)
  } catch (error) {
    console.error('handleAgentAutoReply', error)
  }
}
