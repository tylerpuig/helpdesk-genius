import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
// import { and, eq, desc, asc } from 'drizzle-orm'
// import * as schema from '~/server/db/schema'
import * as dbQueryUtils from '~/server/db/utils/queries'

export const metricsRouter = createTRPCRouter({
  getTodayTicketMetrics: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const metrics = await dbQueryUtils.getLast7DaysMetrics(input.workspaceId)
      return metrics
    }),
  getTicketsCreatedLast7Days: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const tickets = await dbQueryUtils.getTicketsCreatedLast7Days(input.workspaceId)
      return tickets
    }),
  getRecentTickets: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const tickets = await dbQueryUtils.getRecentTickets(input.workspaceId)
      return tickets
    })
})
