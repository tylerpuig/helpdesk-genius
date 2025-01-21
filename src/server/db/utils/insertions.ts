import * as schema from '~/server/db/schema'
import { db } from '~/server/db'
import { eq, sql } from 'drizzle-orm'
import { type TRPCContext } from '~/server/api/trpc'

export async function createNewEmailMessageReply(
  threadId: string,
  messageContent: string,
  context: TRPCContext
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

    await db.insert(schema.messagesTable).values({
      threadId: threadId,
      content: messageContent,
      senderEmail: context?.session?.user?.email ?? '',
      senderName: context?.session?.user?.name ?? '',
      role: 'agent',
      createdAt: messageCreationDate,
      isUnread: false
    })

    // Mark thread as read
    await updateIsThreadRead(threadId, true)

    if (thread) {
      // update user metrics
      await updateUserMetrics({
        userId: context?.session?.user?.id ?? '',
        threadId: threadId,
        isFirstResponse: thread.agentMessageCount === 0,
        responseTimeInSeconds,
        lastMessageAt: messageCreationDate
      })
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
}

export async function updateUserMetrics({
  userId,
  threadId,
  isFirstResponse,
  responseTimeInSeconds,
  lastMessageAt
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
          target: [schema.userDailyMetricsTable.userId, schema.userDailyMetricsTable.date],
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
          target: [schema.userStatsTable.userId],
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
