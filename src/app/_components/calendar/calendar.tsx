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

export default function CalendarView() {
  return (
    <Calendar
      events={[
        {
          id: '1',
          start: new Date(),
          end: new Date(),
          title: 'first event',
          color: 'pink'
        },
        {
          id: '3',
          start: new Date('2025-01-28T10:00:00Z'),
          end: new Date('2025-01-28T11:30:00Z'),
          title: 'another event',
          color: 'purple'
        }
      ]}
    >
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
  )
}
