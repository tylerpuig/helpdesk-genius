import { useEffect, createContext, useState, useContext } from 'react'
import type { ThreadData, MessageData } from '~/trpc/types'
import { api } from '~/trpc/react'

type MessagesContextType = {
  threads: ThreadData[]
  selectedThreadId: string | null
  setSelectedThreadId: (id: string | null) => void
  threadsIsPending: boolean
  messages: MessageData[]
  selectedMessageId: string | null
  setSelectedMessageId(id: string | null): void
  messageIsPending: boolean
}

const MessagesContext = createContext<MessagesContextType>({
  threads: [],
  selectedThreadId: null,
  setSelectedThreadId: () => {},
  threadsIsPending: false,
  messages: [],
  setSelectedMessageId: () => {},
  messageIsPending: false,
  selectedMessageId: null
})

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  //   const [threads, setThreads] = useState<ThreadData[]>([])
  //   const [messages, setMessages] = useState<MessageData[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  const {
    data: threadsData,
    isPending: threadsIsPending,
    isLoading: threadsIsLoading
  } = api.messages.viewMessageThreads.useQuery()

  //   useEffect(() => {
  //     if (threadsData) {
  //       setThreads(threadsData)
  //     }
  //   }, [threadsData])

  const {
    data: messagesData,
    isPending: messagesIsPending,
    isLoading: messagesIsLoading
  } = api.messages.getMessagesFromThread.useQuery(
    { threadId: selectedThreadId ?? '' },
    {
      enabled: selectedThreadId !== null
    }
  )

  //   useEffect(() => {
  //     if (messagesData) {
  //       setMessages(messagesData)
  //     }
  //   }, [messagesData])

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
        selectedMessageId
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages() {
  return useContext(MessagesContext)
}
