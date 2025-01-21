'use client'
import { useRef, useState } from 'react'
import { addDays } from 'date-fns/addDays'
import { addHours } from 'date-fns/addHours'
import { format } from 'date-fns/format'
import { nextSaturday } from 'date-fns/nextSaturday'
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
  CircleCheck
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { EmailThread } from '~/app/_components/mail/thread/email-thread'
import { DropdownMenuContent, DropdownMenuItem } from '~/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { DropdownMenu, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Separator } from '~/components/ui/separator'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useMessages } from '~/hooks/context/useMessages'
import { api } from '~/trpc/react'
import { type MessageData } from '~/trpc/types'
import { useSession } from 'next-auth/react'
import { Content } from '@tiptap/react'
import { MinimalTiptapEditor } from '~/app/_components/minimal-tiptap'
import MessageUtilities from './message-utilities'

export function EmailMessagesDisplay() {
  const today = new Date()
  const { messages, selectedThreadId, refetchThreads, refetchMessages, threads } = useMessages()
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const [replyContent, setReplyContent] = useState<Content>('')
  const viewingThread = selectedThreadId
    ? threads.find((item) => item.thread.id === selectedThreadId)
    : null

  const lastMessage = messages ? messages.at(-1) : null
  const lastMessageIsCustomer = lastMessage?.role === 'customer'

  const sendMessage = api.messages.createEmailMessageReply.useMutation({
    onSuccess: () => {
      refetchMessages()
    }
  })

  function handleSendEmailReply(): void {
    if (messageInputRef.current && selectedThreadId) {
      sendMessage.mutate({
        threadId: selectedThreadId,
        content: messageInputRef.current.value
      })

      messageInputRef.current.value = ''
    }
  }

  return (
    <div className="flex h-full flex-col">
      <MessageUtilities />
      <Separator />
      {selectedThreadId && lastMessage ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt={lastMessage.senderName ?? ''} />
                <AvatarFallback>
                  {(lastMessage.senderName ?? '')
                    .split(' ')
                    .map((chunk) => chunk[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{lastMessage?.senderName}</div>
                <div className="line-clamp-1 text-xs">{lastMessage?.senderEmail}</div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Reply-To:</span> {lastMessage?.senderEmail}
                </div>
              </div>
            </div>
            {lastMessage?.createdAt && (
              <div className="ml-auto text-xs text-muted-foreground">
                {format(lastMessage?.createdAt, 'PPpp')}
              </div>
            )}
          </div>
          <Separator />
          {messages.length > 1 && (
            <EmailThread messages={lastMessageIsCustomer ? messages.slice(0, -1) : messages} />
          )}

          {!lastMessageIsCustomer && <UserHasRepliedAlert latestMessage={lastMessage} />}
          {lastMessageIsCustomer && (
            <div className="whitespace-pre-wrap p-4 text-sm">{lastMessage?.content}</div>
          )}
          <div className="flex flex-1 flex-col">
            <div className="mt-[14rem]">
              <Separator className="mt-2 w-full" />
              <form className="p-4">
                <div className="grid gap-4">
                  <MinimalTiptapEditor
                    value={replyContent}
                    onChange={setReplyContent}
                    className="w-full"
                    editorContentClassName="p-5"
                    output="html"
                    placeholder={`${lastMessageIsCustomer ? `Reply to ${lastMessage?.senderName}` : 'Follow up'}...`}
                    autofocus={true}
                    editable={true}
                    editorClassName="focus:outline-none"
                  />
                  {/* <Textarea
                    ref={messageInputRef}
                    className="h-32 p-2 !text-lg"
                    placeholder={`${lastMessageIsCustomer ? `Reply to ${lastMessage?.senderName}` : 'Follow up'}...`}
                  /> */}
                  <div className="flex items-center">
                    <Label htmlFor="mute" className="flex items-center gap-2 text-xs font-normal">
                      <Switch id="mute" aria-label="Mute thread" /> Mute this thread
                    </Label>
                    <Button
                      onClick={(e) => {
                        e.preventDefault()
                        handleSendEmailReply()
                      }}
                      size="sm"
                      className="ml-auto px-4"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">No message selected</div>
      )}
    </div>
  )
}

function UserHasRepliedAlert({ latestMessage }: { latestMessage: MessageData }) {
  const { data: session } = useSession()
  const isSameUser = latestMessage?.senderEmail === session?.user?.email
  const userName = isSameUser ? 'You' : latestMessage?.senderName
  return (
    <div className="px-4">
      <Alert>
        <CircleCheck className="h-4 w-4 stroke-green-500" />
        <AlertTitle>Ticket resolved</AlertTitle>
        <AlertDescription>
          {userName} replied to this email at {latestMessage?.createdAt?.toLocaleString()}
        </AlertDescription>
      </Alert>
    </div>
  )
}
