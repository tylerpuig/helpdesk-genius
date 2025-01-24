import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { Filter, Settings2 } from 'lucide-react'
import { useThreadStore } from '~/hooks/store/useThread'
import { type ThreadStatus, type ThreadPriority } from '~/server/db/types'

const threadFilterOptions: Array<{ value: ThreadStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
  { value: 'junk', label: 'Junk' },
  { value: 'trash', label: 'Trash' }
]

const threadFilterByPriorityOptions: Array<{ value: ThreadPriority | null; label: string }> = [
  { value: null, label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

const unreadFilterOptions: Array<{ value: 'unread' | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' }
]

export default function FilterThread() {
  const { threadStatus, updateThreadStatus } = useThreadStore()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-30">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={threadStatus}
          onValueChange={(val) => {
            updateThreadStatus(val as ThreadStatus)
          }}
        >
          {threadFilterOptions.map((el) => (
            <DropdownMenuRadioItem key={el.value} value={el.value}>
              {el.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function FilterThreadByPriority() {
  const { threadPriority, updateThreadPriority, updateThreadReadStatus, threadReadStatus } =
    useThreadStore()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-30">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {/* <Tag className="mr-2 h-4 w-4" /> */}
            <span>Priority</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={threadPriority ?? ''}
              onValueChange={(val) => {
                updateThreadPriority(val as ThreadPriority | null)
              }}
            >
              {threadFilterByPriorityOptions.map((el) => (
                <DropdownMenuRadioItem key={el.value} value={el.value ?? ''}>
                  {el.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {/* <Tag className="mr-2 h-4 w-4" /> */}
            <span>Read Status</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={threadReadStatus}
              onValueChange={(val) => {
                updateThreadReadStatus(val as 'unread' | 'all')
              }}
            >
              {unreadFilterOptions.map((el) => (
                <DropdownMenuRadioItem key={el.label} value={el.value}>
                  {el.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
