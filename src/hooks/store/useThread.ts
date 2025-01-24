import { create } from 'zustand'
import { type ThreadStatus, type ThreadPriority } from '~/server/db/types'
import { type ThreadData } from '~/trpc/types'

type MessageThreadStore = {
  selectedThreadId: string
  updateSelectedThreadId: (id: string) => void
  threadStatus: ThreadStatus
  updateThreadStatus: (status: ThreadStatus) => void
  threads: ThreadData[]
  updateThreads: (threads: ThreadData[]) => void
  threadPriority: ThreadPriority | null
  updateThreadPriority: (priority: ThreadPriority | null) => void
  threadReadStatus: 'unread' | 'all'
  updateThreadReadStatus: (status: 'unread' | 'all') => void
}

export const useThreadStore = create<MessageThreadStore>((set) => ({
  selectedThreadId: '',
  updateSelectedThreadId: (id: string) => set({ selectedThreadId: id }),
  threadStatus: 'open',
  updateThreadStatus: (status: ThreadStatus) => set({ threadStatus: status }),
  threads: [],
  updateThreads: (threads: ThreadData[]) => set({ threads }),
  threadPriority: null,
  updateThreadPriority: (priority: ThreadPriority | null) => set({ threadPriority: priority }),
  threadReadStatus: 'all',
  updateThreadReadStatus: (status: 'unread' | 'all') => set({ threadReadStatus: status })
}))
