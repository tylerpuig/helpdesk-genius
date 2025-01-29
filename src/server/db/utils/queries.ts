import { eq, sql, and, gte, lte, count, desc, asc, cosineDistance } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import { db } from '~/server/db'
import { type WorkspaceRole } from '~/server/db/types'

type TicketMetricsForDateRange = {
  avgResponseTimeHours: number
  totalTicketsResolved: number
  pendingTicketCount: number
}

export async function getMetricsForDateRange(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<TicketMetricsForDateRange> {
  const finalResult: TicketMetricsForDateRange = {
    avgResponseTimeHours: 0,
    totalTicketsResolved: 0,
    pendingTicketCount: 0
  }
  try {
    const [results] = await db
      .select({
        avgResponseTimeHours: sql<number>`
          ROUND(CAST(AVG(${schema.userDailyMetricsTable.averageFirstResponseTime}) / 3600.0 AS numeric), 2)
        `.as('avg_response_time_hours'),
        totalTicketsResolved: sql<number>`
          SUM(${schema.userDailyMetricsTable.threadsResolved})
        `.as('total_tickets_resolved'),
        // Add daily breakdown
        date: schema.userDailyMetricsTable.date
      })
      .from(schema.userDailyMetricsTable)
      .where(
        and(
          eq(schema.userDailyMetricsTable.workspaceId, workspaceId),
          gte(schema.userDailyMetricsTable.date, startDate),
          lte(schema.userDailyMetricsTable.date, endDate)
        )
      )
      // Group by date to get daily metrics
      .groupBy(schema.userDailyMetricsTable.date)
      // Order by date descending to get most recent first
      .orderBy(sql`date DESC`)

    const [pendingTickets] = await db
      .select({
        pending: count(schema.threadsTable.id).as('pending')
      })
      .from(schema.threadsTable)
      .where(
        and(
          eq(schema.threadsTable.workspaceId, workspaceId),
          eq(schema.threadsTable.status, 'open'),
          gte(schema.threadsTable.createdAt, startDate),
          lte(schema.threadsTable.createdAt, endDate)
        )
      )
    finalResult.pendingTicketCount = pendingTickets?.pending ?? 0
    finalResult.totalTicketsResolved = Number(results?.totalTicketsResolved) ?? 0
    finalResult.avgResponseTimeHours = Number(results?.avgResponseTimeHours) ?? 0
  } catch (error) {
    console.error(error)
  }

  return finalResult
}

export async function getLast7DaysMetrics(workspaceId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return getMetricsForDateRange(workspaceId, sevenDaysAgo, new Date())
}

export async function getTicketsCreatedOverTimeByDay(
  workSpaceId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const ticketCounts = await db
      .select({
        // Use date_trunc to group by day
        date: sql<string>`date_trunc('day', ${schema.threadsTable.createdAt})::date`,
        count: count(schema.threadsTable.id).as('count')
      })
      .from(schema.threadsTable)
      .where(
        and(
          eq(schema.threadsTable.workspaceId, workSpaceId),
          gte(schema.threadsTable.createdAt, startDate),
          lte(schema.threadsTable.createdAt, endDate)
        )
      )
      // Group by the truncated date
      .groupBy(sql`date_trunc('day', ${schema.threadsTable.createdAt})::date`)
      // Order by date ascending
      .orderBy(sql`date_trunc('day', ${schema.threadsTable.createdAt})::date`)

    // Transform results to desired format
    return ticketCounts.map((record) => ({
      date: record.date,
      count: Number(record.count)
    }))
  } catch (error) {
    console.error('Error fetching tickets over time:', error)
    return []
  }
}

export async function getTicketsCreatedLast7Days(workspaceId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return getTicketsCreatedOverTimeByDay(workspaceId, sevenDaysAgo, new Date())
}

export async function getRecentTickets(workspaceId: string) {
  try {
    const tickets = await db
      .select({
        id: schema.threadsTable.id,
        title: schema.threadsTable.title,
        priority: schema.threadsTable.priority,
        status: schema.threadsTable.status,
        createdAt: schema.threadsTable.createdAt,
        channel: schema.threadsTable.channel
      })
      .from(schema.threadsTable)
      .where(
        and(
          eq(schema.threadsTable.workspaceId, workspaceId),
          eq(schema.threadsTable.status, 'open'),
          eq(schema.threadsTable.channel, 'email')
        )
      )
      .orderBy(desc(schema.threadsTable.createdAt))
      .limit(5)

    return tickets
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function getRecentChatThreads(workspaceId: string) {
  try {
    const threads = await db
      .select({
        id: schema.threadsTable.id,
        title: schema.threadsTable.title,
        priority: schema.threadsTable.priority,
        status: schema.threadsTable.status,
        createdAt: schema.threadsTable.createdAt,
        channel: schema.threadsTable.channel
      })
      .from(schema.threadsTable)
      .where(
        and(
          eq(schema.threadsTable.workspaceId, workspaceId),
          eq(schema.threadsTable.status, 'open'),
          eq(schema.threadsTable.channel, 'chat')
        )
      )
      .orderBy(desc(schema.threadsTable.createdAt))
      .limit(5)

    return threads
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        image: schema.users.image,
        password: schema.users.password
      })
      .from(schema.users)
      .where(eq(schema.users.email, email))

    return user
  } catch (err) {
    console.error(err)
    return null
  }
}
type IsUserTeamMemberResponse = {
  isMember: boolean
  role: WorkspaceRole
}

export async function isUserWorkspaceMember(
  userId: string,
  teamId: string
): Promise<IsUserTeamMemberResponse> {
  const result: IsUserTeamMemberResponse = {
    isMember: false,
    role: 'member'
  }
  try {
    const teamMember = await db.query.workspaceMembersTable.findFirst({
      where: and(
        eq(schema.workspaceMembersTable.workspaceId, teamId),
        eq(schema.workspaceMembersTable.userId, userId)
      ),
      columns: {
        role: true
      }
    })

    if (teamMember) {
      result.isMember = true
      result.role = teamMember.role
    }
  } catch (err) {
    console.error(err)
  }

  return result
}

export async function getChatMessages(threadId: string) {
  try {
    const messages = await db
      .select({
        id: schema.messagesTable.id,
        content: schema.messagesTable.content,
        role: schema.messagesTable.role,
        createdAt: schema.messagesTable.createdAt,
        senderEmail: schema.messagesTable.senderEmail,
        senderName: schema.messagesTable.senderName
      })
      .from(schema.messagesTable)
      .where(eq(schema.messagesTable.threadId, threadId))
      .orderBy(asc(schema.messagesTable.createdAt))

    return messages
  } catch (error) {
    console.error('getChatMessages', error)
  }
}

export async function getThreadIdFromChatId(chatId: string): Promise<string | undefined> {
  try {
    const result = await db.query.liveChatsTable.findFirst({
      where: eq(schema.liveChatsTable.id, chatId)
    })

    return result?.threadId ?? ''
  } catch (error) {
    console.error('getThreadIdFromChatId', error)
  }
}

export type EnabledAgentData = NonNullable<
  Awaited<ReturnType<typeof getEnabledAgentsForWorkspace>>
>[number]
export async function getEnabledAgentsForWorkspace(workspaceId: string) {
  try {
    const agents = await db.query.agentsTable.findMany({
      where: and(
        eq(schema.agentsTable.workspaceId, workspaceId),
        eq(schema.agentsTable.enabled, true),
        eq(schema.agentsTable.allowAutoReply, true)
      ),
      columns: {
        id: true,
        title: true,
        description: true
      }
    })

    return agents
  } catch (error) {
    console.error('getAgentsForWorkspace', error)
  }
}

export async function findSimilarMessagesFromAgentKnowledge(
  agentId: string,
  messageEmbedding: number[]
) {
  try {
    const similarity = sql<number>`1 - (${cosineDistance(schema.knowledgeBaseEmbeddingsTable.embedding, messageEmbedding)})`

    const results = await db
      .select({
        content: schema.knowledgeBaseEmbeddingsTable.rawContent,
        similarity: similarity
      })
      .from(schema.knowledgeBaseEmbeddingsTable)
      .where(eq(schema.knowledgeBaseEmbeddingsTable.agentId, agentId))
      .orderBy(desc(similarity))
      .limit(3)

    return results
  } catch (error) {
    console.error('findSimilarMessagesFromAgentKnowledge', error)
  }
}

export type PreviousThreadContext = NonNullable<
  Awaited<ReturnType<typeof getPreviousThreadContext>>
>
export async function getPreviousThreadContext(threadId: string, limit: number) {
  try {
    const previousMessages = await db.query.messagesTable.findMany({
      where: and(eq(schema.messagesTable.id, threadId)),
      orderBy: desc(schema.messagesTable.createdAt),
      columns: {
        content: true,
        senderName: true,
        senderEmail: true,
        role: true
      },
      limit: limit
    })
    return previousMessages
  } catch (error) {
    console.error('getPreviousThreadContext', error)
  }
}
