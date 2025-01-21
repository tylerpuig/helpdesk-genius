import { create } from 'zustand'

type ForwardMessageStore = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useForwardMessageDialog = create<ForwardMessageStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false })
}))
