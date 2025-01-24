import { create } from 'zustand'

type ContactStore = {
  selectedContactEmail: string
  setSelectedContactEmail: (selectedContactEmail: string) => void
  contactSummarySheetOpen: boolean
  setContactSummarySheetOpen: (open: boolean) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  selectedContactEmail: '',
  setSelectedContactEmail: (selectedContactEmail: string) => set({ selectedContactEmail }),
  contactSummarySheetOpen: false,
  setContactSummarySheetOpen: (open: boolean) => set({ contactSummarySheetOpen: open })
}))
