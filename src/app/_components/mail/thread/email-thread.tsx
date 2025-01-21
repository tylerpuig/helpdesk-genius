'use client'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useRef } from 'react'
import { type MessageData } from '~/trpc/types'
import { useSession } from 'next-auth/react'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'

export function EmailThread({ messages }: { messages: MessageData[] }) {
  const [isThreadVisible, setIsThreadVisible] = useState(false)

  return (
    <div className="flex flex-col">
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isThreadVisible ? '1fr' : '0fr'
        }}
      >
        <div className="overflow-hidden">
          <ScrollArea className="max-h-32rem">
            <div className="min-h-0">
              {messages.map((message) => (
                <EmailThreadMessage key={message.id} message={message} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex items-center gap-4 py-2">
        <Separator className="flex-1" />
        <button
          onClick={() => setIsThreadVisible(!isThreadVisible)}
          className="text-sm text-gray-400 transition-colors hover:text-gray-200"
        >
          {isThreadVisible ? 'Close' : 'Open'} {messages.length} message
          {messages.length !== 1 ? 's' : ''}
        </button>
        <Separator className="flex-1" />
      </div>
    </div>
  )
}

function EmailThreadMessage({ message }: { message: MessageData }) {
  const { data: session } = useSession()
  const [isExpanded, setIsExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className="p-2">
      <div
        className="flex cursor-pointer gap-3 rounded-lg px-4 py-1 transition-colors hover:bg-gray-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded)
            e.preventDefault()
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={message?.senderName ?? ''} alt={message?.senderName ?? ''} />
          <AvatarFallback className="rounded-lg">CN</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-medium text-gray-200">
              {message?.senderEmail === session?.user?.email ? 'You' : message?.senderName}
            </span>
            <span className="text-sm text-gray-400">{message?.createdAt?.toLocaleString()}</span>

            <div className="ml-auto">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          <div
            className="grid transition-all duration-200 ease-in-out"
            style={{
              gridTemplateRows: isExpanded ? '1fr' : '0fr'
            }}
          >
            <div className="overflow-hidden">
              <div className="mt-2 text-sm leading-relaxed text-gray-300">
                {message?.content ?? ''}
              </div>
            </div>
          </div>
          {!isExpanded && (
            <p className="truncate text-sm text-gray-400">{message?.content.substring(0, 100)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
