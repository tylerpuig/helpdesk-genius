'use client'
import { useRef } from 'react'
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
  Trash2
} from 'lucide-react'
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

export function EmailMessagesDisplay() {
  const today = new Date()
  const { messages, selectedThreadId, refetchThreads, refetchMessages } = useMessages()
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  const lastMessage = messages ? messages.at(-1) : null
  const sendMessage = api.messages.createEmailMessageReply.useMutation({
    onSuccess: () => {
      refetchMessages()
    }
  })
  const markThreadAsUnread = api.messages.markThreadAsUnread.useMutation({
    onSuccess: () => {
      refetchThreads()
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
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!selectedThreadId}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!selectedThreadId}>
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!selectedThreadId}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!selectedThreadId}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button variant="ghost" className="justify-start font-normal">
                      Later today{' '}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(today, 4), 'E, h:m b')}
                      </span>
                    </Button>
                    <Button variant="ghost" className="justify-start font-normal">
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 1), 'E, h:m b')}
                      </span>
                    </Button>
                    <Button variant="ghost" className="justify-start font-normal">
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(today), 'E, h:m b')}
                      </span>
                    </Button>
                    <Button variant="ghost" className="justify-start font-normal">
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 7), 'E, h:m b')}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!selectedThreadId}>
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!selectedThreadId}>
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!selectedThreadId}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!lastMessage}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                if (!selectedThreadId) return
                markThreadAsUnread.mutate({ threadId: selectedThreadId })
              }}
            >
              Mark as unread
            </DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
          {messages.length > 1 && <EmailThread messages={messages} />}
          {lastMessage?.role === 'customer' && (
            <div className="flex-1 whitespace-pre-wrap p-4 text-sm">{lastMessage?.content}</div>
          )}
          <Separator className="mt-auto" />
          <div className="p-4">
            <form>
              <div className="grid gap-4">
                <Textarea
                  ref={messageInputRef}
                  className="p-4"
                  placeholder={`Reply ${lastMessage?.senderName}...`}
                />
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
                    className="ml-auto"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">No message selected</div>
      )}
    </div>
  )
}
