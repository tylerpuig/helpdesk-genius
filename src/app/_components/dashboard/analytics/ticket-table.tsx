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
import { useMessages } from '~/hooks/context/useMessages'
import { useRouter } from 'next/navigation'

export function TicketTable() {
  const router = useRouter()
  const { data: tickets, isPending } = api.metrics.getRecentTickets.useQuery()
  const { setSelectedThreadId } = useMessages()

  function handleSelectRow(threadId: string): void {
    setSelectedThreadId(threadId)
    router.push(`/dashboard/tickets`)
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Tickets</CardTitle>
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
                    onClick={() => handleSelectRow(ticket.id)}
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
