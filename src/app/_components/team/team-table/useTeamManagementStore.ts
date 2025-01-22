import { create } from 'zustand'

type TeamManagementStore = {
  isEdituserSheetOpen: boolean
  tablePage: number
  openEditUserSheet: () => void
  clostEditUserSheet: () => void
  updateTablePage: (page: number) => void
  selectedTeamId: string
  updateSelectedTeamId: (teamId: string) => void
}

export const useTeamManagementStore = create<TeamManagementStore>()((set) => ({
  isEdituserSheetOpen: false,
  tablePage: 0,
  openEditUserSheet: () => set({ isEdituserSheetOpen: true }),
  clostEditUserSheet: () => set({ isEdituserSheetOpen: false }),
  updateTablePage: (page: number) => set({ tablePage: page }),
  selectedTeamId: '',
  updateSelectedTeamId: (teamId: string) => set({ selectedTeamId: teamId })
}))
