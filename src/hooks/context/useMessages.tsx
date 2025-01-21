import { createContext, useState, useContext } from 'react'
import type { ThreadData, MessageData } from '~/trpc/types'
import { api } from '~/trpc/react'
import { type ThreadStatus } from '~/server/db/types'

type MessagesContextType = {
  threads: ThreadData[]
  selectedThreadId: string | null
  setSelectedThreadId: (id: string | null) => void
  threadsIsPending: boolean
  messages: MessageData[]
  selectedMessageId: string | null
  setSelectedMessageId(id: string | null): void
  messageIsPending: boolean
  refetchMessages(): void
  refetchThreads(): void
  selectedThreadStatus: ThreadStatus
  setSelectedThreadStatus(status: ThreadStatus): void
}

const MessagesContext = createContext<MessagesContextType>({
  threads: [],
  selectedThreadId: null,
  setSelectedThreadId: () => {},
  threadsIsPending: false,
  messages: [],
  setSelectedMessageId: () => {},
  messageIsPending: false,
  selectedMessageId: null,
  refetchMessages: () => {},
  refetchThreads: () => {},
  selectedThreadStatus: 'open',
  setSelectedThreadStatus: () => {}
})

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [selectedThreadStatus, setSelectedThreadStatus] = useState<ThreadStatus>('open')

  const {
    data: threadsData,
    isPending: threadsIsPending,
    isLoading: threadsIsLoading,
    refetch: refetchThreadsTrpc
  } = api.messages.viewEmailMessageThreads.useQuery({
    status: selectedThreadStatus
  })

  const {
    data: messagesData,
    isPending: messagesIsPending,
    isLoading: messagesIsLoading,
    refetch: refetchMessagesTrpc
  } = api.messages.getEmailMessagesFromThread.useQuery(
    { threadId: selectedThreadId ?? '' },
    {
      enabled: selectedThreadId !== null
    }
  )

  function refetchMessages(): void {
    refetchMessagesTrpc()
  }

  function refetchThreads(): void {
    refetchThreadsTrpc()
  }

  return (
    <MessagesContext.Provider
      value={{
        threads: threadsData ?? [],
        selectedThreadId,
        setSelectedThreadId,
        threadsIsPending: threadsIsPending || threadsIsLoading,
        messages: messagesData ?? [],
        setSelectedMessageId,
        messageIsPending: messagesIsPending || messagesIsLoading,
        selectedMessageId,
        refetchMessages,
        refetchThreads,
        selectedThreadStatus,
        setSelectedThreadStatus
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages() {
  return useContext(MessagesContext)
}
