import { db } from '~/server/db'
import * as schema from '~/server/db/schema'
import { and, eq, desc, asc, sql } from 'drizzle-orm'

type NewCalendarEntry = {
  startTime: Date
  endTime: Date
  title: string
  description: string
}

export async function createNewCalendarEvent(entry: NewCalendarEntry, workspaceId: string) {
  try {
  } catch (err) {
    console.error('createNewCalendarEvent', err)
  }
}
