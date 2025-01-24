import { db } from './dbInstance.mjs'
import { exists, eq, and, sql, gte, lte } from 'drizzle-orm'
import { threadAssignmentsTable, threadsTable, messagesTable } from '../src/server/db/schema'

function getDateRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { start, end }
}

// Get user metrics for a specific time range
export async function getUserMetrics({
  senderEmail,
  workspaceId,
  days
}: {
  senderEmail: string
  workspaceId: string
  days: number
}) {
  const { start, end } = getDateRange(days)

  // Get threads the user has participated in (as an agent)
  const threadMetrics = await db
    .select({
      totalThreads: sql<number>`count(distinct ${messagesTable.threadId})`,
      resolvedThreads: sql<number>`count(distinct case 
      when ${threadsTable.status} = 'closed' 
      then ${messagesTable.threadId} 
      end)`
    })
    .from(messagesTable)
    .innerJoin(threadsTable, eq(messagesTable.threadId, threadsTable.id))
    .where(
      and(
        eq(threadsTable.workspaceId, workspaceId),
        gte(messagesTable.createdAt, start),
        lte(messagesTable.createdAt, end),
        exists(
          db
            .select()
            .from(messagesTable)
            .where(
              and(
                eq(messagesTable.threadId, threadsTable.id),
                eq(messagesTable.role, 'agent'),
                eq(messagesTable.senderEmail, senderEmail)
              )
            )
        )
      )
    )

  // Get message metrics for threads the user participated in
  const messageMetrics = await db
    .select({
      totalMessages: sql<number>`count(*)`,
      agentMessages: sql<number>`count(case when ${messagesTable.role} = 'agent' then 1 end)`,
      customerMessages: sql<number>`count(case when ${messagesTable.role} = 'customer' then 1 end)`
    })
    .from(messagesTable)
    .innerJoin(threadsTable, eq(messagesTable.threadId, threadsTable.id))
    .where(
      and(
        eq(threadsTable.workspaceId, workspaceId),
        gte(messagesTable.createdAt, start),
        lte(messagesTable.createdAt, end),
        exists(
          db
            .select()
            .from(messagesTable)
            .where(
              and(
                eq(messagesTable.threadId, threadsTable.id),
                eq(messagesTable.role, 'agent'),
                eq(messagesTable.senderEmail, senderEmail)
              )
            )
        )
      )
    )

  // Get response times for threads where the user responded
  const responseTimeMetrics = await db
    .select({
      threadId: messagesTable.threadId,
      firstCustomerMessage: sql<Date>`min(case 
        when ${messagesTable.role} = 'customer' 
        then ${messagesTable.createdAt} 
        end)`,
      firstAgentResponse: sql<Date>`min(case 
        when ${messagesTable.role} = 'agent' 
        and ${messagesTable.senderEmail} = ${senderEmail}
        then ${messagesTable.createdAt} 
        end)`
    })
    .from(messagesTable)
    .innerJoin(threadsTable, eq(messagesTable.threadId, threadsTable.id))
    .where(
      and(
        eq(threadsTable.workspaceId, workspaceId),
        gte(messagesTable.createdAt, start),
        lte(messagesTable.createdAt, end)
      )
    )
    .groupBy(messagesTable.threadId).having(sql`min(case 
      when ${messagesTable.role} = 'agent' 
      and ${messagesTable.senderEmail} = ${senderEmail}
      then 1 
      end) = 1`) // Only include threads where the user responded

  // Calculate average response times
  const avgFirstResponseTime =
    responseTimeMetrics.reduce((sum, thread) => {
      if (thread.firstCustomerMessage && thread.firstAgentResponse) {
        const customerTime = new Date(thread.firstCustomerMessage).getTime()
        const agentTime = new Date(thread.firstAgentResponse).getTime()
        const responseTime = agentTime - customerTime
        return sum + responseTime / 1000 // Convert to seconds
      }
      return sum
    }, 0) / (responseTimeMetrics.length || 1)

  return {
    threadMetrics: {
      totalThreads: Number(threadMetrics[0]?.totalThreads ?? 0),
      resolvedThreads: Number(threadMetrics[0]?.resolvedThreads ?? 0),
      resolutionRate: threadMetrics[0]?.totalThreads
        ? (Number(threadMetrics[0]?.resolvedThreads) / Number(threadMetrics[0]?.totalThreads)) * 100
        : 0
    },
    messageMetrics: {
      totalMessages: Number(messageMetrics[0]?.totalMessages ?? 0),
      agentMessages: Number(messageMetrics[0]?.agentMessages ?? 0),
      customerMessages: Number(messageMetrics[0]?.customerMessages ?? 0),
      avgFirstResponseTime,
      responseRate: messageMetrics[0]?.totalMessages
        ? (Number(messageMetrics[0]?.agentMessages) / Number(messageMetrics[0]?.totalMessages)) *
          100
        : 0
    }
  }
}

type DailyUseMetric = {
  date: string
  threadMetrics: {
    totalThreads: number
    resolvedThreads: number
    resolutionRate: number
  }
  messageMetrics: {
    totalMessages: number
    agentMessages: number
    customerMessages: number
    avgFirstResponseTime: number
    responseRate: number
  }
}
export async function getDailyUserMetrics({
  senderEmail,
  workspaceId,
  days
}: {
  senderEmail: string
  workspaceId: string
  days: number
}): Promise<DailyUseMetric[]> {
  // Calculate metrics by date
  const dailyMetrics = new Map<string, DailyUseMetric>()
  try {
    const { start, end } = getDateRange(days)

    // Get daily thread metrics
    const threadMetrics = await db
      .select({
        date: sql<string>`DATE(${messagesTable.createdAt})`,
        totalThreads: sql<number>`count(distinct ${messagesTable.threadId})`,
        resolvedThreads: sql<number>`count(distinct case 
        when ${threadsTable.status} = 'closed' 
        then ${messagesTable.threadId} 
        end)`
      })
      .from(messagesTable)
      .innerJoin(threadsTable, eq(messagesTable.threadId, threadsTable.id))
      .where(
        and(
          eq(threadsTable.workspaceId, workspaceId),
          gte(messagesTable.createdAt, start),
          lte(messagesTable.createdAt, end),
          exists(
            db
              .select()
              .from(messagesTable)
              .where(
                and(
                  eq(messagesTable.threadId, threadsTable.id),
                  eq(messagesTable.role, 'agent'),
                  eq(messagesTable.senderEmail, senderEmail)
                )
              )
          )
        )
      )
      .groupBy(sql`DATE(${messagesTable.createdAt})`)

    // Get daily message metrics
    const messageMetrics = await db
      .select({
        date: sql<string>`DATE(${messagesTable.createdAt})`,
        totalMessages: sql<number>`count(*)`,
        agentMessages: sql<number>`count(case when ${messagesTable.role} = 'agent' then 1 end)`,
        customerMessages: sql<number>`count(case when ${messagesTable.role} = 'customer' then 1 end)`
      })
      .from(messagesTable)
      .innerJoin(threadsTable, eq(messagesTable.threadId, threadsTable.id))
      .where(
        and(
          eq(threadsTable.workspaceId, workspaceId),
          gte(messagesTable.createdAt, start),
          lte(messagesTable.createdAt, end),
          exists(
            db
              .select()
              .from(messagesTable)
              .where(
                and(
                  eq(messagesTable.threadId, threadsTable.id),
                  eq(messagesTable.role, 'agent'),
                  eq(messagesTable.senderEmail, senderEmail)
                )
              )
          )
        )
      )
      .groupBy(sql`DATE(${messagesTable.createdAt})`)

    // Get daily response times
    const responseTimeMetrics = await db
      .select({
        date: sql<string>`DATE(${messagesTable.createdAt})`,
        threadId: messagesTable.threadId,
        firstCustomerMessage: sql<Date>`min(case 
        when ${messagesTable.role} = 'customer' 
        then ${messagesTable.createdAt} 
        end)`,
        firstAgentResponse: sql<Date>`min(case 
        when ${messagesTable.role} = 'agent' 
        and ${messagesTable.senderEmail} = ${senderEmail}
        then ${messagesTable.createdAt} 
        end)`
      })
      .from(messagesTable)
      .innerJoin(threadsTable, eq(messagesTable.threadId, threadsTable.id))
      .where(
        and(
          eq(threadsTable.workspaceId, workspaceId),
          gte(messagesTable.createdAt, start),
          lte(messagesTable.createdAt, end)
        )
      )
      .groupBy(sql`DATE(${messagesTable.createdAt})`, messagesTable.threadId).having(sql`min(case 
      when ${messagesTable.role} = 'agent' 
      and ${messagesTable.senderEmail} = ${senderEmail}
      then 1 
      end) = 1`)

    // Initialize the map with thread metrics
    threadMetrics.forEach((thread) => {
      dailyMetrics.set(thread.date, {
        date: thread.date,
        threadMetrics: {
          totalThreads: Number(thread.totalThreads ?? 0),
          resolvedThreads: Number(thread.resolvedThreads ?? 0),
          resolutionRate: thread.totalThreads
            ? (Number(thread.resolvedThreads) / Number(thread.totalThreads)) * 100
            : 0
        },
        messageMetrics: {
          totalMessages: 0,
          agentMessages: 0,
          customerMessages: 0,
          avgFirstResponseTime: 0,
          responseRate: 0
        }
      })
    })

    // Add message metrics
    messageMetrics.forEach((message) => {
      const metrics = dailyMetrics.get(message.date) || {
        date: message.date,
        threadMetrics: {
          totalThreads: 0,
          resolvedThreads: 0,
          resolutionRate: 0
        },
        messageMetrics: {
          totalMessages: 0,
          agentMessages: 0,
          customerMessages: 0,
          avgFirstResponseTime: 0,
          responseRate: 0
        }
      }

      metrics.messageMetrics.totalMessages = Number(message.totalMessages ?? 0)
      metrics.messageMetrics.agentMessages = Number(message.agentMessages ?? 0)
      metrics.messageMetrics.customerMessages = Number(message.customerMessages ?? 0)
      metrics.messageMetrics.responseRate = message.totalMessages
        ? (Number(message.agentMessages) / Number(message.totalMessages)) * 100
        : 0

      dailyMetrics.set(message.date, metrics)
    })

    // Calculate daily average response times
    const responseTimesByDate = new Map()
    responseTimeMetrics.forEach((thread) => {
      if (!thread.firstCustomerMessage || !thread.firstAgentResponse) return

      const metrics = responseTimesByDate.get(thread.date) || {
        totalTime: 0,
        count: 0
      }

      const customerTime = new Date(thread.firstCustomerMessage).getTime()
      const agentTime = new Date(thread.firstAgentResponse).getTime()
      metrics.totalTime += (agentTime - customerTime) / 1000 // Convert to seconds
      metrics.count += 1
      responseTimesByDate.set(thread.date, metrics)
    })

    // Add response times to daily metrics
    responseTimesByDate.forEach((responseTimes, date) => {
      const metrics = dailyMetrics.get(date)
      if (metrics) {
        metrics.messageMetrics.avgFirstResponseTime = responseTimes.totalTime / responseTimes.count
      }
    })
  } catch (error) {
    console.error(error)
  }

  return Array.from(dailyMetrics.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}
async function run() {
  // Usage:
  const last7DaysMetrics = await getUserMetrics({
    senderEmail: 'demo@example.com',
    workspaceId: 'e3146484-79bc-40b0-87ce-e58e108608c0',
    days: 30
  })

  const dailyMetrics = await getDailyUserMetrics({
    senderEmail: 'demo@example.com',
    workspaceId: 'fe2c85c0-88b4-4248-b724-7dd93eac53ce',
    days: 30
  })
  console.log(dailyMetrics)

  console.log(last7DaysMetrics)
}
// run()
