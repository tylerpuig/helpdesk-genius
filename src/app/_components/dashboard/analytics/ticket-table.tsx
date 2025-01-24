'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { api } from '~/trpc/react'
import { Skeleton } from '~/components/ui/skeleton'
import { useThreadStore } from '~/hooks/store/useThread'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { useRouter } from 'next/navigation'
import { type ThreadStatus } from '~/server/db/types'
import { useChatStore } from '~/app/_components/chat/useChatStore'

type BaseTicketInfo = {
  id: string
  title: string | null
  priority: string
  status: ThreadStatus
  createdAt: Date
}

type TicketTableProps<T extends BaseTicketInfo> = {
  tickets: T[]
  handleSelectRow: (threadId: string) => void
  isPending: boolean
  title: string
}

export function TicketTable({
  tickets,
  handleSelectRow,
  isPending,
  title
}: TicketTableProps<BaseTicketInfo>) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets && !isPending ? (
              <>
                {tickets.map((ticket) => (
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => {
                      handleSelectRow(ticket.id)
                    }}
                    key={ticket.id}
                  >
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>{ticket.priority}</TableCell>
                    <TableCell>{ticket.status}</TableCell>
                    <TableCell>{ticket.createdAt.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </>
            ) : (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-1/2" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function RecentTicketsTable() {
  const router = useRouter()
  const { selectedWorkspaceId } = useWorkspace()
  const { data: tickets, isPending } = api.metrics.getRecentTickets.useQuery(
    {
      workspaceId: selectedWorkspaceId
    },
    {
      enabled: selectedWorkspaceId !== ''
    }
  )
  const { updateSelectedThreadId } = useThreadStore()
  function handleSelectRow(threadId: string): void {
    updateSelectedThreadId(threadId)
    router.push(`/dashboard/tickets`)
  }

  return (
    <TicketTable
      tickets={tickets ?? []}
      handleSelectRow={handleSelectRow}
      isPending={isPending}
      title="Recent Tickets"
    />
  )
}

export function RecentChatThreadsTable() {
  const router = useRouter()
  const { selectedWorkspaceId } = useWorkspace()
  const { data: threads, isPending } = api.chat.getRecentChatThreads.useQuery(
    {
      workspaceId: selectedWorkspaceId
    },
    {
      enabled: selectedWorkspaceId !== ''
    }
  )
  const { setSelectedThreadId } = useChatStore()
  function handleSelectRow(threadId: string): void {
    setSelectedThreadId(threadId)
    router.push(`/dashboard/chat`)
  }

  return (
    <TicketTable
      tickets={threads ?? []}
      handleSelectRow={handleSelectRow}
      isPending={isPending}
      title="Recent Chats"
    />
  )
}
