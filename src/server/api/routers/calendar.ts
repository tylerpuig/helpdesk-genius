import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import * as schema from '~/server/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { type CalendarEvent } from '~/app/_components/calendar/full-calendar'

export const calendarRouter = createTRPCRouter({
  getCalendarEvents: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string()
      })
    )
    .query(async ({ input, ctx }) => {
      const events = await ctx.db
        .select({
          id: schema.calendarEventTable.id,
          title: schema.calendarEventTable.title,
          description: schema.calendarEventTable.description,
          start: schema.calendarEventTable.start,
          end: schema.calendarEventTable.end,
          color: schema.calendarEventTable.color
        })
        .from(schema.calendarEventTable)
        .where(eq(schema.calendarEventTable.workspaceId, input.workspaceId))
        .orderBy(asc(schema.calendarEventTable.start))

      const formattedEvents: CalendarEvent[] = events.map((event) => ({
        id: event.id,
        start: event.start,
        end: event.end,
        title: event.title,
        color: event.color,
        description: event.description
      }))

      return formattedEvents
    }),
  getSingleEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        workspaceId: z.string()
      })
    )
    .query(async ({ input, ctx }) => {
      const [event] = await ctx.db
        .select({
          id: schema.calendarEventTable.id,
          title: schema.calendarEventTable.title,
          description: schema.calendarEventTable.description,
          start: schema.calendarEventTable.start,
          end: schema.calendarEventTable.end,
          color: schema.calendarEventTable.color
        })
        .from(schema.calendarEventTable)
        .where(
          and(
            eq(schema.calendarEventTable.id, input.eventId),
            eq(schema.calendarEventTable.workspaceId, input.workspaceId)
          )
        )

      return event
    }),
  deleteEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        workspaceId: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(schema.calendarEventTable)
        .where(
          and(
            eq(schema.calendarEventTable.id, input.eventId),
            eq(schema.calendarEventTable.workspaceId, input.workspaceId)
          )
        )
    })
})
