import { addDays } from 'date-fns/addDays'
import { addHours } from 'date-fns/addHours'
import { format } from 'date-fns/format'
import { nextSaturday } from 'date-fns/nextSaturday'
import { cn } from '~/lib/utils'
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
  CheckCheck,
  Tag,
  Check,
  Settings
} from 'lucide-react'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '~/components/ui/dropdown-menu'
import { Separator } from '~/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useThreadStore } from '~/hooks/store/useThread'
import { api } from '~/trpc/react'
import { type ThreadStatus } from '~/server/db/types'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { useForwardMessageDialog } from '~/app/_components/mail/utilities/forward-email-message/useForwardMessage'
import { useTagStore } from '~/app/_components/mail/utilities/tags/useTagStore'

const updateThreadStatusButtons: Array<{
  status: ThreadStatus
  label: string
  tooltipContent: string
  icon: React.ReactNode
}> = [
  {
    status: 'archived',
    label: 'Archive',
    tooltipContent: 'Archive',
    icon: <Archive className="h-4 w-4" />
  },

  {
    status: 'junk',
    label: 'Move to junk',
    tooltipContent: 'Move to junk',
    icon: <ArchiveX className="h-4 w-4" />
  },
  {
    status: 'trash',
    label: 'Move to trash',
    tooltipContent: 'Move to trash',
    icon: <Trash2 className="h-4 w-4" />
  },
  {
    status: 'closed',
    label: 'Close',
    tooltipContent: 'Close',
    icon: <CheckCheck className="h-4 w-4" />
  }
]

export default function MessageUtilities() {
  const today = new Date()
  const {
    selectedThreadId,
    threads,
    threadStatus,
    updateSelectedThreadId,
    threadPriority,
    threadReadStatus
  } = useThreadStore()
  const { selectedWorkspaceId } = useWorkspace()
  const { open: openForwardMessageDialog } = useForwardMessageDialog()
  const { setTagManagerSheetOpen } = useTagStore()

  const { refetch: refetchThreads } = api.messages.viewEmailMessageThreads.useQuery(
    {
      status: threadStatus,
      workspaceId: selectedWorkspaceId,
      threadPriority,
      readStatus: threadReadStatus
    },
    {
      enabled: false
    }
  )

  const { data: tags } = api.messages.getWorkspaceTags.useQuery({
    workspaceId: selectedWorkspaceId
  })

  const markThreadAsUnread = api.messages.updateThreadReadStatus.useMutation({
    onSuccess: () => {
      refetchThreads()
    }
  })

  const updateThreadStatus = api.messages.updateThreadStatus.useMutation({
    onSuccess: () => {
      // set the selected thread to the first thread in the list
      const firstThreadId = threads?.[0]?.id
      if (!firstThreadId) return
      updateSelectedThreadId(firstThreadId)
      refetchThreads()
    }
  })

  const updateTagForThread = api.messages.updateTagForThread.useMutation({
    onSuccess: () => {
      refetchThreads()
    }
  })

  const viewingThread = selectedThreadId
    ? threads.find((item) => item.id === selectedThreadId)
    : null

  const viewingThreadTags = viewingThread?.tags ?? []
  const viewingThreadTagIds = viewingThreadTags.map((tag) => tag.tagId)

  const threadIsUnread = viewingThread?.isUnread

  return (
    <div className="flex items-center p-2">
      <div className="flex items-center gap-2">
        {updateThreadStatusButtons.map((el) => (
          <Tooltip key={el.status}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  if (!selectedThreadId) return
                  updateThreadStatus.mutate({
                    threadId: selectedThreadId,
                    status: el.status,
                    workspaceId: selectedWorkspaceId
                  })
                }}
                variant="ghost"
                size="icon"
                disabled={!selectedThreadId}
              >
                {el.icon}
                <span className="sr-only">{el.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{el.tooltipContent}</TooltipContent>
          </Tooltip>
        ))}

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
            <Button
              onClick={() => openForwardMessageDialog()}
              variant="ghost"
              size="icon"
              disabled={!selectedThreadId}
            >
              <Forward className="h-4 w-4" />
              <span className="sr-only">Forward</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Forward</TooltipContent>
        </Tooltip>
      </div>
      <Separator orientation="vertical" className="mx-2 h-6" />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={!selectedThreadId}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              if (!selectedThreadId) return
              if (!threadIsUnread) {
                markThreadAsUnread.mutate({ threadId: selectedThreadId, isUnread: true })
              } else {
                markThreadAsUnread.mutate({ threadId: selectedThreadId, isUnread: false })
              }
            }}
          >
            {viewingThread?.isUnread ? 'Mark as read' : 'Mark as unread'}
          </DropdownMenuItem>
          <DropdownMenuItem>Star thread</DropdownMenuItem>
          {/* <DropdownMenuItem>Add label</DropdownMenuItem> */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Tag className="mr-2 h-4 w-4" />
              <span>Add Tag</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => {
                  setTagManagerSheetOpen(true)
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {tags &&
                tags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onSelect={(event) => {
                      event.preventDefault()
                    }}
                    onClick={(event) => {
                      event.preventDefault()
                      const isSelected = viewingThreadTagIds.includes(tag.id)
                      updateTagForThread.mutate({
                        threadId: selectedThreadId,
                        tagId: tag.id,
                        action: isSelected ? 'remove' : 'add'
                      })
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        viewingThreadTagIds.includes(tag.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {tag.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>Mute thread</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
