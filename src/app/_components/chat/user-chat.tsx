'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Phone,
  Video,
  Info,
  MoreVertical,
  PlusCircle,
  ImageIcon,
  Smile,
  ThumbsUp,
  ChevronRight,
  ChevronLeft,
  Scroll
} from 'lucide-react'
import { MinimalTiptapEditor } from '~/app/_components/minimal-tiptap'
import { ScrollArea } from '~/components/ui/scroll-area'
import { MessageInput } from '~/components/ui/message-input'

interface Message {
  id: number
  content: string
  sender: string
  time: string
  isCurrentUser: boolean
}

interface Chat {
  id: number
  name: string
  status?: string
  avatar: string
  lastMessage?: string
}

const MIN_SIDEBAR_WIDTH = 60
const MAX_SIDEBAR_WIDTH = 320
const DEFAULT_SIDEBAR_WIDTH = 280

export default function ChatInterface() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const sidebarRef = useRef<HTMLDivElement>(null)

  const [chats] = useState<Chat[]>([
    {
      id: 1,
      name: 'Jane Doe',
      status: 'Typing...',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 2,
      name: 'John Doe',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 3,
      name: 'Elizabeth Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    },
    {
      id: 4,
      name: 'John Smith',
      avatar:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7mrHAmTuZO2SzuJbESSs31jf2IHN7s.png'
    }
  ])

  const [messages] = useState<Message[]>([
    {
      id: 1,
      content: 'I am good too!',
      sender: 'Jane Doe',
      time: '10:04 AM',
      isCurrentUser: false
    },
    {
      id: 2,
      content: 'That is good to hear!',
      sender: 'You',
      time: '10:05 AM',
      isCurrentUser: true
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 3,
      content: 'How has your day been so far?',
      sender: 'Jane Doe',
      time: '10:06 AM',
      isCurrentUser: false
    },
    {
      id: 4,
      content:
        'It has been good. I went for a run this morning and then had a nice breakfast. How about you?',
      sender: 'You',
      time: '10:10 AM',
      isCurrentUser: true
    },
    {
      id: 5,
      content: 'Awesome! I am just chilling outside.',
      sender: 'Jane Doe',
      time: '10:42 PM',
      isCurrentUser: false
    }
  ])

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  //   const resize = useCallback(
  //     (mouseMoveEvent: MouseEvent) => {
  //       if (isResizing && sidebarRef.current) {
  //         const newWidth = mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left
  //         if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
  //           setSidebarWidth(newWidth)
  //         }
  //       }
  //     },
  //     [isResizing]
  //   )

  //   useEffect(() => {
  //     window.addEventListener('mousemove', resize)
  //     window.addEventListener('mouseup', stopResizing)
  //     return () => {
  //       window.removeEventListener('mousemove', resize)
  //       window.removeEventListener('mouseup', stopResizing)
  //     }
  //   }, [resize, stopResizing])

  const toggleSidebar = () => {
    setSidebarWidth(sidebarWidth === MIN_SIDEBAR_WIDTH ? DEFAULT_SIDEBAR_WIDTH : MIN_SIDEBAR_WIDTH)
  }

  const isCollapsed = sidebarWidth <= MIN_SIDEBAR_WIDTH

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
            {!isCollapsed && <h2 className="font-semibold text-white">Chats (4)</h2>}
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
          <ScrollArea className="h-full">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex cursor-pointer items-center gap-3 p-4 hover:bg-zinc-900"
              >
                <Avatar className="h-10 w-10 border-2 border-orange-500">
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white">{chat.name}</div>
                    {chat.status && <div className="text-sm text-zinc-400">{chat.status}</div>}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
          {/* </div> */}
        </div>

        {/* Resizer */}
        <div className="w-1 cursor-col-resize bg-zinc-800" onMouseDown={startResizing} />

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-orange-500">
                <AvatarImage src={chats[0]!.avatar} />
                <AvatarFallback>{chats[0]!.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-white">{chats[0].name}</div>
                <div className="text-sm text-zinc-400">Active 2 mins ago</div>
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

          <ScrollArea className="h-full">
            <div className="flex-1 space-y-4 overflow-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  {!message.isCurrentUser && (
                    <Avatar className="h-8 w-8 border-2 border-orange-500">
                      <AvatarImage src={chats[0].avatar} />
                      <AvatarFallback>{message.sender[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-md rounded-2xl px-4 py-2 ${
                      message.isCurrentUser ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <span className="mt-1 block text-xs opacity-60">{message.time}</span>
                  </div>
                  {message.isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t border-zinc-800 p-4">
            <MessageInput
              value={chatMessage}
              className="text-md"
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
