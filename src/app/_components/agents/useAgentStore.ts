import { create } from 'zustand'

type UseAgentStore = {
  selectedAgentId: string
  setSelectedAgentId(id: string): void
  addNewAgentDialogOpen: boolean
  setAddNewAgentDialogOpen(open: boolean): void
}

export const useAgentStore = create<UseAgentStore>((set) => ({
  selectedAgentId: '',
  setSelectedAgentId: (selectedAgentId: string) => set({ selectedAgentId }),
  addNewAgentDialogOpen: false,
  setAddNewAgentDialogOpen: (open: boolean) => set({ addNewAgentDialogOpen: open })
}))
