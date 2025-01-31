import * as schema from '~/server/db/schema'
import { db } from '~/server/db'
import { eq, sql, and } from 'drizzle-orm'
import { type TRPCContext } from '~/server/api/trpc'
import * as openaiUtils from '~/server/integrations/openai'
import bcrypt from 'bcrypt'
import * as emailGenerationUtils from '~/server/integrations/email'
import { type CalendarCreateEventParams } from '~/server/integrations/agents/knowledge/requests'
import { type BaseMessage } from '@langchain/core/messages'
import { type AdditionalMessageMetadata } from '~/server/integrations/agents/knowledge/router'

export async function createNewEmailMessageReply(
  threadId: string,
  messageContent: string,
  context: TRPCContext,
  workspaceId: string
) {
  try {
    const thread = await db.query.threadsTable.findFirst({
      where: eq(schema.threadsTable.id, threadId)
    })

    // Calculate response time in seconds
    const responseTimeInSeconds = thread
      ? Math.floor((Date.now() - thread.createdAt.getTime()) / 1000)
      : undefined

    const messageCreationDate = new Date()

    const [newMessage] = await db
      .insert(schema.messagesTable)
      .values({
        threadId: threadId,
        content: messageContent,
        senderEmail: context?.session?.user?.email ?? '',
        senderName: context?.session?.user?.name ?? '',
        role: 'agent',
        createdAt: messageCreationDate,
        isUnread: false
      })
      .returning({
        id: schema.messagesTable.id
      })

    // Mark thread as read
    await updateIsThreadRead(threadId, false)

    if (thread) {
      // update user metrics
      await updateUserMetrics({
        userId: context?.session?.user?.id ?? '',
        threadId: threadId,
        isFirstResponse: thread.agentMessageCount === 0,
        responseTimeInSeconds,
        lastMessageAt: messageCreationDate,
        workspaceId
      })
    }

    if (newMessage?.id) {
      // await openaiUtils.generateEmailMessageReply(newMessage.id, threadId)
      await emailGenerationUtils.addEmailToAgentKnowledgeBase(messageContent, workspaceId, threadId)
    }
  } catch (error) {
    console.error('createNewEmailMessageReply', error)
  }
}

type UpdateMetricsParams = {
  userId: string
  threadId: string
  isFirstResponse: boolean
  responseTimeInSeconds?: number
  lastMessageAt: Date
  workspaceId: string
}

export async function updateUserMetrics({
  userId,
  threadId,
  isFirstResponse,
  responseTimeInSeconds,
  lastMessageAt,
  workspaceId
}: UpdateMetricsParams) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start a transaction to ensure all updates are atomic
    await db.transaction(async (tx) => {
      // 1. Update or create daily metrics
      const dailyMetrics = await tx
        .insert(schema.userDailyMetricsTable)
        .values({
          userId,
          workspaceId,
          date: today,
          responseCount: 1,
          agentMessageCount: 1,
          ...(isFirstResponse && responseTimeInSeconds
            ? {
                averageFirstResponseTime: responseTimeInSeconds
              }
            : {})
        })
        .onConflictDoUpdate({
          target: [
            schema.userDailyMetricsTable.workspaceId,
            schema.userDailyMetricsTable.userId,
            schema.userDailyMetricsTable.date
          ],
          set: {
            responseCount: sql`${schema.userDailyMetricsTable.responseCount} + 1`,
            agentMessageCount: sql`${schema.userDailyMetricsTable.agentMessageCount} + 1`,
            ...(isFirstResponse && responseTimeInSeconds
              ? {
                  averageFirstResponseTime: sql`
                  (${schema.userDailyMetricsTable.averageFirstResponseTime} *
                   ${schema.userDailyMetricsTable.threadsAssigned} + ${responseTimeInSeconds}) /
                  (${schema.userDailyMetricsTable.threadsAssigned} + 1)
                `
                }
              : {}),
            totalResponseTime: sql`${schema.userDailyMetricsTable.totalResponseTime} + ${
              responseTimeInSeconds || 0
            }`
          }
        })
        .returning()

      // 2. Update user's overall stats
      await tx
        .insert(schema.userStatsTable)
        .values({
          workspaceId,
          userId,
          totalAgentMessages: 1,
          lastActiveAt: new Date(),
          ...(isFirstResponse && responseTimeInSeconds
            ? {
                averageFirstResponseTime: responseTimeInSeconds
              }
            : {})
        })
        .onConflictDoUpdate({
          target: [schema.userStatsTable.userId, schema.userStatsTable.workspaceId],
          set: {
            totalAgentMessages: sql`${schema.userStatsTable.totalAgentMessages} + 1`,
            lastActiveAt: new Date(),
            ...(isFirstResponse && responseTimeInSeconds
              ? {
                  averageFirstResponseTime: sql`
            (${schema.userStatsTable.averageFirstResponseTime} *
             ${schema.userStatsTable.totalThreadsHandled} + ${responseTimeInSeconds}) /
            (${schema.userStatsTable.totalThreadsHandled} + 1)
            `
                }
              : {}),
            averageResponseTime: sql`
      (${schema.userStatsTable.averageResponseTime} * ${schema.userStatsTable.totalAgentMessages} + ${
        responseTimeInSeconds || 0
      }) / (${schema.userStatsTable.totalAgentMessages} + 1)
      `
          }
        })

      // 3. Update thread metrics
      await tx
        .update(schema.threadsTable)
        .set({
          messageCount: sql`${schema.threadsTable.messageCount} + 1`,
          agentMessageCount: sql`${schema.threadsTable.agentMessageCount} + 1`,
          lastMessageAt: lastMessageAt,
          ...(isFirstResponse && responseTimeInSeconds
            ? {
                firstResponseTime: responseTimeInSeconds
              }
            : {})
        })
        .where(eq(schema.threadsTable.id, threadId))

      return dailyMetrics
    })
  } catch (error) {
    console.error('updateUserMetrics', error)
  }
}

export async function updateIsThreadRead(threadId: string, status: boolean): Promise<void> {
  try {
    // Update thread as read / unread
    await db
      .update(schema.threadsTable)
      .set({ isUnread: status })
      .where(eq(schema.threadsTable.id, threadId))
  } catch (error) {
    console.error('updateIsThreadRead', error)
  }
}

export async function incrementUserResolvedThread(
  userId: string,
  workspaceId: string
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    await db
      .update(schema.userStatsTable)
      .set({
        totalThreadsResolved: sql`${schema.userStatsTable.totalThreadsResolved} + 1`,
        totalThreadsHandled: sql`${schema.userStatsTable.totalThreadsHandled} + 1`
      })
      .where(
        and(
          eq(schema.userStatsTable.userId, userId),
          eq(schema.userStatsTable.workspaceId, workspaceId)
        )
      )

    await db
      .insert(schema.userDailyMetricsTable)
      .values({
        userId,
        workspaceId,
        date: today,
        threadsResolved: 1
      })
      .onConflictDoUpdate({
        target: [
          schema.userDailyMetricsTable.workspaceId,
          schema.userDailyMetricsTable.userId,
          schema.userDailyMetricsTable.date
        ],
        set: {
          threadsResolved: sql`${schema.userDailyMetricsTable.threadsResolved} + 1`
        }
      })
  } catch (error) {
    console.error('incrementUserResolvedThread', error)
  }
}

export async function createNewUser(email: string, name: string, password: string) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        name,
        password: hashedPassword
      })
      .returning()

    return user
  } catch (error) {
    console.error('createUser', error)
  }
}

export async function createNewChat(workspaceId: string, message: string) {
  try {
    const threadTitle = await openaiUtils.generateChatThreadTitle(message)
    const [chat] = await db
      .insert(schema.threadsTable)
      .values({
        workspaceId,
        channel: 'chat',
        title: threadTitle
      })
      .returning()

    return chat
  } catch (error) {
    console.error('createNewChat', error)
  }
}

export async function createNewChatMessage(
  threadId: string,
  content: string,
  userInfo: { name: string; email: string },
  role: 'customer' | 'agent'
) {
  try {
    if (role === 'agent') {
      userInfo.name = 'Agent'
      userInfo.email = 'agent@your-workspace.com'
    }
    const [message] = await db
      .insert(schema.messagesTable)
      .values({
        threadId,
        content: content,
        role: role,
        senderEmail: userInfo?.email ?? '',
        senderName: userInfo?.name ?? ''
      })
      .returning()

    // mark thre thread as unread
    await updateIsThreadRead(threadId, true)

    return message
  } catch (error) {
    console.error('createNewChatMessage', error)
  }
}

export async function createNewAIChatMessage(threadId: string, message: BaseMessage) {
  try {
    const messageContent = Array.isArray(message.content)
      ? message.content.join('\n')
      : message.content

    const metadata = message.additional_kwargs?.metadata as AdditionalMessageMetadata
    console.log('kwargs: ', message.additional_kwargs)

    const [newMessage] = await db
      .insert(schema.messagesTable)
      .values({
        threadId,
        content: messageContent,
        role: 'agent',
        senderEmail: metadata?.agentTitle
          ? metadata?.agentTitle + '@your-workspace.com'
          : 'agent@your-workspace.com',
        senderName: metadata?.agentTitle ?? 'Agent'
      })
      .returning()

    // mark thre thread as unread
    await updateIsThreadRead(threadId, true)

    return newMessage
  } catch (error) {
    console.error('createNewChatMessage', error)
  }
}

export async function createNewAutoReplyChatMessage(
  threadId: string,
  content: string,
  agentId: string
) {
  try {
    const agent = await db.query.agentsTable.findFirst({
      where: eq(schema.agentsTable.id, agentId)
    })

    if (!agent) {
      throw new Error('Agent not found')
    }

    const formattedEmail = agent.title.replaceAll(' ', '') + '@your-workspace.com'

    const [message] = await db
      .insert(schema.messagesTable)
      .values({
        threadId,
        content: content,
        role: 'agent',
        senderEmail: formattedEmail ?? '',
        senderName: agent.title ?? ''
      })
      .returning()

    // mark thre thread as unread
    await updateIsThreadRead(threadId, false)

    return message
  } catch (error) {
    console.error('createNewChatMessage', error)
  }
}

export async function createLiveChatThread(chatId: string, threadId: string) {
  try {
    const [result] = await db
      .insert(schema.liveChatsTable)
      .values({
        id: chatId,
        threadId
      })
      .returning()

    return result
  } catch (error) {
    console.error('createLiveChatThread', error)
  }
}

export async function createNewContactFromChat(email: string, name: string, workspaceId: string) {
  try {
    await db
      .insert(schema.contactsTable)
      .values({
        name,
        email,
        workspaceId
      })
      .onConflictDoNothing()
  } catch (err) {
    console.error('createNewContactFromChat', err)
  }
}

export async function createKnowledgeFromAutoReply(
  agentId: string,
  knowledgeContent: string,
  embeddingContent: string
) {
  try {
    await db.insert(schema.knowledgeBaseEmbeddingsTable).values({
      agentId,
      embedding: await openaiUtils.generateEmbeddingFromText(embeddingContent),
      rawContent: knowledgeContent,
      rawContentSummary: await openaiUtils.generateAgentKnowledgeSummary(knowledgeContent)
    })
  } catch (error) {
    console.error('createKnowledgeFromAutoReply', error)
  }
}

export async function createCalendarEvent(
  eventDetails: CalendarCreateEventParams,
  workspaceId: string
): Promise<void> {
  try {
    // const parsedEvent = calendarEventSchemaStrict.parse(eventDetails)
    if (!eventDetails.title || !eventDetails.startTime || !eventDetails.endTime) {
      return
    }

    await db.insert(schema.calendarEventTable).values({
      title: eventDetails.title,
      description: eventDetails.description,
      start: new Date(eventDetails.startTime),
      end: new Date(eventDetails.endTime),
      color: 'purple',
      workspaceId
    })
  } catch (err) {
    console.error('createCalendarEvent', err)
  }
}
