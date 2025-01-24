import { create } from 'zustand'

type UseChatStore = {
  selectedThreadId: string
  setSelectedThreadId: (selectedThreadId: string) => void
}

export const useChatStore = create<UseChatStore>((set) => ({
  selectedThreadId: '',
  setSelectedThreadId: (selectedThreadId: string) => set({ selectedThreadId })
}))
