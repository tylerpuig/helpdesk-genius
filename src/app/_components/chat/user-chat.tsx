'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  Phone,
  Video,
  Info,
  MoreVertical,
  PlusCircle,
  ChevronRight,
  ChevronLeft,
  User
} from 'lucide-react'
import { ScrollArea } from '~/components/ui/scroll-area'
import { MessageInput } from '~/components/ui/message-input'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow } from 'date-fns'
import { Skeleton } from '~/components/ui/skeleton'
import { useChatStore } from '~/app/_components/chat/useChatStore'

const MIN_SIDEBAR_WIDTH = 80
const DEFAULT_SIDEBAR_WIDTH = 280

function formatDate(date: Date) {
  const fmt = formatDistanceToNow(date, {
    addSuffix: true
  })

  // Replace both "less than" and "about" prefixes
  return fmt.replace('less than ', '').replace('about ', '')
}

export default function ChatInterface() {
  const { data: session } = useSession()
  const { setSelectedThreadId, selectedThreadId } = useChatStore()
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [chatMessage, setChatMessage] = useState('')
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { selectedWorkspaceId } = useWorkspace()

  const toggleSidebar = () => {
    setSidebarWidth(sidebarWidth === MIN_SIDEBAR_WIDTH ? DEFAULT_SIDEBAR_WIDTH : MIN_SIDEBAR_WIDTH)
  }

  const isCollapsed = sidebarWidth <= MIN_SIDEBAR_WIDTH

  const {
    data: threadsData,
    refetch: refetchThreads,
    isPending: threadDataPending
  } = api.chat.getChatThreads.useQuery({
    workspaceId: selectedWorkspaceId
  })

  const { data: messages, refetch: refetchMessages } = api.chat.getChatMessagesFromThread.useQuery({
    threadId: selectedThreadId
  })

  const sendChatMessage = api.chat.sendChatMessage.useMutation({
    onSuccess: () => {
      refetchMessages()
      refetchThreads()
    }
  })

  api.chat.useChatSubscription.useSubscription(undefined, {
    onData: (_) => {
      refetchThreads()
      refetchMessages()
    }
  })

  const markThreadAsRead = api.chat.markChatThreadAsRead.useMutation({
    onSuccess: () => {
      refetchThreads()
    }
  })

  const selectedThread = threadsData?.find((thread) => thread.thread.id === selectedThreadId)
  return (
    <div className="flex">
      <div className="mx-auto flex w-full flex-row overflow-hidden border">
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className="flex flex-col border-r border-zinc-800"
          style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            {!isCollapsed && (
              <h2 className="font-semibold text-white">{threadsData?.length ?? '0'} Chats</h2>
            )}
            <div className="flex gap-2">
              {!isCollapsed && (
                <>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
                onClick={toggleSidebar}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          {/* <div className="flex-1 overflow-auto"> */}
          <ScrollArea className="max-h-[49rem]">
            {threadDataPending && !threadsData && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2 border-t border-zinc-800 p-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </>
            )}
            {threadsData &&
              threadsData.map((thread) => (
                <div
                  key={thread.thread.id}
                  onClick={async () => {
                    setSelectedThreadId(thread.thread.id)
                    await markThreadAsRead.mutateAsync({ threadId: thread.thread.id })
                  }}
                  className={`group flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:bg-zinc-900 ${
                    selectedThreadId === thread.thread.id ? 'bg-zinc-900' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <User className="h-10 w-10 shrink-0 rounded-full border-2 border-purple-800 bg-zinc-800 p-1" />

                    {!isCollapsed && (
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Header row with name, unread indicator, and time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {thread?.latestMessage?.senderName || 'Unknown'}
                            </span>
                            {thread.thread.isUnread && (
                              <div className="h-2 w-2 rounded-full bg-purple-500" />
                            )}
                          </div>
                          <span className="text-xs text-zinc-500">
                            {thread?.latestMessage?.createdAt
                              ? formatDate(thread.latestMessage.createdAt)
                              : ''}
                          </span>
                        </div>

                        {/* Thread title */}
                        <div className="text-sm text-zinc-400">{thread?.thread.title}</div>

                        {/* Message preview */}
                        <div className="line-clamp-1 text-sm text-zinc-500">
                          {thread?.latestMessage?.content || 'No messages yet'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </ScrollArea>
          {/* </div> */}
        </div>

        {/* Resizer */}
        <div className="w-1 cursor-col-resize bg-zinc-800" />

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <User className="h-10 w-10 rounded-full border-2 border-purple-800" />
              <div>
                <div className="font-medium text-white">
                  {selectedThread?.latestMessage?.senderName ?? ''}
                </div>
                <div className="text-sm text-zinc-400">
                  {messages && messages?.messages?.length > 0 ? (
                    <>{format(messages?.lastMessageTime ?? '', 'h:mm a')}</>
                  ) : (
                    <Skeleton className="h-5 w-full" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="max-h-[50rem] min-h-[50rem]">
            <div className="flex-1 space-y-4 overflow-auto p-4">
              {messages?.messages &&
                messages.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.role !== 'customer' ? 'flex-row-reverse' : ''}`}
                  >
                    {message.role !== 'customer' && (
                      <Avatar className="h-8 w-8 border-2 border-orange-500">
                        <AvatarImage src={session?.user?.image ?? ''} />
                        <AvatarFallback>{''}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-md rounded-2xl px-4 py-2 ${
                        message.role !== 'customer'
                          ? 'bg-blue-800 text-white'
                          : 'bg-zinc-800 text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <span className="mt-1 block text-xs opacity-60">
                        {message.createdAt.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t border-zinc-800 p-4">
            <MessageInput
              value={chatMessage}
              className="text-md"
              placeholder={
                selectedThread
                  ? `Reply to ${selectedThread?.latestMessage?.senderName ?? ''}...`
                  : 'Start a new chat...'
              }
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  await sendChatMessage.mutateAsync({
                    threadId: selectedThreadId,
                    workspaceId: selectedWorkspaceId,
                    content: chatMessage
                  })
                  setChatMessage('')
                }
              }}
              onChange={(e) => {
                setChatMessage(e.target.value)
              }}
              isGenerating={false}
            />
            <div className="mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
