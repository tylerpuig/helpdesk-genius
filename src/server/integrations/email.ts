import { db } from '~/server/db'
import { and, desc, eq } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as dbQueryUtils from '~/server/db/utils/queries'
import * as openaiUtils from '~/server/integrations/openai'
import * as dbInsertionUtils from '~/server/db/utils/insertions'

export async function generateEmailMessageReply(
  workspaceId: string,
  threadId: string
): Promise<string> {
  try {
    const agents = await dbQueryUtils.getEnabledAgentsForWorkspace(workspaceId)
    if (!agents) {
      throw new Error('No agents found')
    }

    const latestMessage = await db.query.messagesTable.findFirst({
      where: eq(schema.messagesTable.threadId, threadId),
      orderBy: desc(schema.messagesTable.createdAt)
    })

    if (!latestMessage) {
      throw new Error('No latest message found')
    }

    const messageData = await db.query.messagesTable.findFirst({
      where: and(
        eq(schema.messagesTable.id, latestMessage.id),
        eq(schema.messagesTable.threadId, threadId)
      )
    })

    if (!messageData) {
      throw new Error('Message not found')
    }

    const suggestedAgentIds = await openaiUtils.suggestAgentsFromMessageContent(
      messageData.content,
      agents
    )

    if (suggestedAgentIds.length < 1) {
      throw new Error('No agent found')
    }

    const messageEmbedding = await openaiUtils.generateEmbeddingFromText(messageData.content)
    if (!messageEmbedding) {
      throw new Error('Failed to generate embedding')
    }

    const similarMessages = await dbQueryUtils.findSimilarMessagesFromAgentKnowledge(
      suggestedAgentIds[0]!,
      messageEmbedding
    )

    // console.log(similarMessages)

    if (!similarMessages?.length) {
      throw new Error('No similar messages found')
    }

    // get last 3 messages from thread
    const previousThreadMessages = await dbQueryUtils.getPreviousThreadContext(threadId, 3)
    // console.log('previousThreadMessages', previousThreadMessages)

    const replyInfo = await openaiUtils.generateAutoReplyMessage(
      messageData.content,
      similarMessages.map((message) => message.content).join('\n\n'),
      previousThreadMessages ?? []
    )
    // console.log('autoReply', replyInfo)

    if (!replyInfo?.autoReply) {
      throw new Error('No auto reply found')
    }

    return replyInfo.autoReply
  } catch (error) {
    console.error('handleAgentAutoReply', error)
  }

  return ''
}

export async function addEmailToAgentKnowledgeBase(
  messageContent: string,
  workspaceId: string,
  threadId: string
) {
  try {
    const agents = await dbQueryUtils.getEnabledAgentsForWorkspace(workspaceId)
    if (!agents?.length) {
      throw new Error('No agents found')
    }

    // const suggestedAgentId = await openaiUtils.suggestAgentsFromMessageContent(
    //   messageContent,
    //   agents
    // )
    const suggestedAgentId = ''

    console.log('suggestedAgentId', suggestedAgentId)

    if (!suggestedAgentId) {
      throw new Error('No agent found')
    }

    const previousThreadMessages = await dbQueryUtils.getPreviousThreadContext(threadId, 3)

    const prevousMessagesContent = (previousThreadMessages ?? [])
      .map((message) => {
        return `message: ${message.content} name: ${message.senderName} email: ${message.senderEmail} role: ${message.role} \n`
      })
      .join('\n')

    const embeddingContent = `
    ${messageContent}

    ${prevousMessagesContent}`

    const messageSummary = await openaiUtils.generateEmailContextSummary(messageContent)

    const knowledgeContent = `
    Summary: ${messageSummary}

    Reply: ${messageContent}
    `

    await dbInsertionUtils.createKnowledgeFromAutoReply(
      suggestedAgentId,
      knowledgeContent,
      embeddingContent
    )
  } catch (error) {
    console.error('addEmailToAgentKnowledgeBase', error)
  }
}
