import { create } from 'zustand'

type CalendarStore = {
  selectedCalendarEventId: string
  setSelectedCalendarEventId: (id: string) => void
  viewCalendarEventSheetOpen: boolean
  setViewCalendarEventSheetOpen: (open: boolean) => void
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  selectedCalendarEventId: '',
  setSelectedCalendarEventId: (id: string) => set(() => ({ selectedCalendarEventId: id })),
  viewCalendarEventSheetOpen: false,
  setViewCalendarEventSheetOpen: (open: boolean) =>
    set(() => ({ viewCalendarEventSheetOpen: open }))
}))
