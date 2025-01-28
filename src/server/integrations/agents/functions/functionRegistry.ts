// functionRegistry.ts
import { db } from '~/server/db'
import { calendarEventTable } from '~/server/db/schema'
import * as FunctionParamTypes from '~/server/integrations/agents/functions/types'

type FunctionHandler = (
  workspaceId: string,
  args: FunctionParamTypes.DefaultAgentReturnParams
) => Promise<boolean>

const functionRegistry: Record<string, FunctionHandler> = {
  'calendar.createEvent': async (
    workspaceId: string,
    args: FunctionParamTypes.CalendarCreateEventParams
  ) => {
    try {
      const result = await db
        .insert(calendarEventTable)
        .values({
          workspaceId,
          title: args.title,
          description: args.description,
          start: new Date(args.startTime),
          end: new Date(args.endTime),
          color: 'blue'
        })
        .returning()

      if (result) return true
    } catch (err) {
      console.error('createEvent err', err)
    }
    return false
  }

  // 'calendar.deleteEvent': async (workspaceId: string, args: { eventId: string }) => {
  //   return db
  //     .delete(calendarEventTable)
  //     .where(
  //       and(
  //         eq(calendarEventTable.id, args.eventId),
  //         eq(calendarEventTable.workspaceId, workspaceId)
  //       )
  //     )
  // }
}

export function getAgentFunctionHandler(key: string): FunctionHandler | undefined {
  return functionRegistry[key]
}
