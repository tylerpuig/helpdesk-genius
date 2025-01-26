import { create } from 'zustand'

type UseAgentStore = {
  selectedAgentId: string
  setSelectedAgentId(id: string): void
  addNewAgentDialogOpen: boolean
  setAddNewAgentDialogOpen(open: boolean): void
  agentKnowledgeSheetOpen: boolean
  setAgentKnowledgeSheetOpen(open: boolean): void
  selectedKnowledgeId: string
  setSelectedKnowledgeId(selectedKnowledgeId: string): void
}

export const useAgentStore = create<UseAgentStore>((set) => ({
  selectedAgentId: '',
  setSelectedAgentId: (selectedAgentId: string) => set({ selectedAgentId }),
  addNewAgentDialogOpen: false,
  setAddNewAgentDialogOpen: (open: boolean) => set({ addNewAgentDialogOpen: open }),
  agentKnowledgeSheetOpen: false,
  setAgentKnowledgeSheetOpen: (open: boolean) => set({ agentKnowledgeSheetOpen: open }),
  selectedKnowledgeId: '',
  setSelectedKnowledgeId: (selectedKnowledgeId: string) => set({ selectedKnowledgeId })
}))
