import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { Filter } from 'lucide-react'
import { useMessages } from '~/hooks/context/useMessages'
import { type ThreadStatus } from '~/server/db/types'

const threadFilterOptions: Array<{ value: ThreadStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
  { value: 'junk', label: 'Junk' },
  { value: 'trash', label: 'Trash' }
]

export default function FilterThread() {
  const { selectedThreadStatus, setSelectedThreadStatus } = useMessages()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Filter Threads</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedThreadStatus}
          onValueChange={(val) => {
            setSelectedThreadStatus(val as ThreadStatus)
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
