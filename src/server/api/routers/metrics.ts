// import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
// import { and, eq, desc, asc } from 'drizzle-orm'
// import * as schema from '~/server/db/schema'
import * as dbQueryUtils from '~/server/db/utils/queries'

export const metricsRouter = createTRPCRouter({
  getTodayTicketMetrics: protectedProcedure.query(async ({ ctx, input }) => {
    const metrics = await dbQueryUtils.getLast7DaysMetrics()
    return metrics
  }),
  getTicketsCreatedLast7Days: protectedProcedure.query(async ({ ctx, input }) => {
    const tickets = await dbQueryUtils.getTicketsCreatedLast7Days()
    return tickets
  })
})
