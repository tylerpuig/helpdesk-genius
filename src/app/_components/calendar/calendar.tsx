'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Calendar,
  CalendarDayView,
  CalendarMonthView,
  CalendarWeekView,
  CalendarYearView,
  CalendarCurrentDate,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger
} from '~/app/_components/calendar/full-calendar'
import { type CalendarEvent } from '~/app/_components/calendar/full-calendar'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { useCalendar } from '~/app/_components/calendar/full-calendar'
import ViewCalendarEventSheet from '~/app/_components/calendar/view-calendar-event-sheet'

export default function CalendarView() {
  const { selectedWorkspaceId } = useWorkspace()
  // const [eventsState, setEventsState] = useState<CalendarEvent[] | null>(null)

  const { data: events, isPending } = api.calendar.getCalendarEvents.useQuery({
    workspaceId: selectedWorkspaceId
  })

  return (
    <>
      <ViewCalendarEventSheet />
      {events && (
        <Calendar events={events}>
          <div className="flex h-dvh flex-col py-6">
            <div className="mb-6 flex items-center gap-2 px-6">
              <CalendarViewTrigger className="aria-[current=true]:bg-accent" view="day">
                Day
              </CalendarViewTrigger>
              <CalendarViewTrigger view="week" className="aria-[current=true]:bg-accent">
                Week
              </CalendarViewTrigger>
              <CalendarViewTrigger view="month" className="aria-[current=true]:bg-accent">
                Month
              </CalendarViewTrigger>
              <CalendarViewTrigger view="year" className="aria-[current=true]:bg-accent">
                Year
              </CalendarViewTrigger>

              <span className="flex-1" />

              <CalendarCurrentDate />

              <CalendarPrevTrigger>
                <ChevronLeft size={20} />
                <span className="sr-only">Previous</span>
              </CalendarPrevTrigger>

              <CalendarTodayTrigger>Today</CalendarTodayTrigger>

              <CalendarNextTrigger>
                <ChevronRight size={20} />
                <span className="sr-only">Next</span>
              </CalendarNextTrigger>

              {/* <ModeToggle /> */}
            </div>

            <div className="relative flex-1 overflow-auto px-6">
              <CalendarDayView />
              <CalendarWeekView />
              <CalendarMonthView />
              <CalendarYearView />
            </div>
          </div>
        </Calendar>
      )}
    </>
  )
}
