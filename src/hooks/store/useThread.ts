import { create } from 'zustand'
import { type ThreadStatus } from '~/server/db/types'
import { type ThreadData } from '~/trpc/types'

type MessageThreadStore = {
  selectedThreadId: string
  updateSelectedThreadId: (id: string) => void
  threadStatus: ThreadStatus
  updateThreadStatus: (status: ThreadStatus) => void
  threads: ThreadData[]
  updateThreads: (threads: ThreadData[]) => void
}

export const useThreadStore = create<MessageThreadStore>((set) => ({
  selectedThreadId: '',
  updateSelectedThreadId: (id: string) => set({ selectedThreadId: id }),
  threadStatus: 'open',
  updateThreadStatus: (status: ThreadStatus) => set({ threadStatus: status }),
  threads: [],
  updateThreads: (threads: ThreadData[]) => set({ threads })
}))
