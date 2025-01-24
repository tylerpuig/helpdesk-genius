import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { and, eq, desc, asc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as dbQueryUtils from '~/server/db/utils/queries'
import * as dbMetricsUtils from '~/server/db/utils/metrics'
import { TRPCError } from '@trpc/server'

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
    }),
  getDailyUserMetrics: protectedProcedure
    .input(z.object({ workspaceId: z.string(), days: z.number(), userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(schema.users.id, input.userId),
        columns: {
          email: true
        }
      })

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User not found'
        })
      }

      const metrics = await dbMetricsUtils.getDailyUserMetrics({
        senderEmail: user.email,
        workspaceId: input.workspaceId,
        days: input.days
      })

      return metrics
    })
})
