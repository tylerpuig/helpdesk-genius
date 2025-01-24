'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Sparkle, Trash } from 'lucide-react'
import { api } from '~/trpc/react'
import { Skeleton } from '~/components/ui/skeleton'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { Button } from '~/components/ui/button'
import { type ContactData } from '~/trpc/types'
import { useContactStore } from './useContactStore'

export default function WorkspaceContactsTable() {
  const { selectedWorkspaceId } = useWorkspace()

  const {
    data,
    isPending,
    refetch: refetchContacts
  } = api.contacts.getWorkspaceContacts.useQuery({
    workspaceId: selectedWorkspaceId
  })

  const { setSelectedContactEmail, setContactSummarySheetOpen } = useContactStore()

  const deleteContact = api.contacts.deleteContact.useMutation({
    onSuccess: () => {
      refetchContacts()
    }
  })

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between px-1">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <ExportContacts contacts={data ?? []} />
      </div>
      <Table>
        <TableHeader className="sticky top-0 bg-gray-900">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Last Contacted</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending && !data && (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}
          {data &&
            data.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>{contact.name ?? ''}</TableCell>
                <TableCell>{contact?.email ?? ''}</TableCell>
                <TableCell>{contact.company ?? ''}</TableCell>
                <TableCell>{contact.lastContactedAt?.toLocaleString() ?? ''}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedContactEmail(contact.email)
                          setContactSummarySheetOpen(true)
                        }}
                      >
                        <Sparkle className="mr-2 h-4 w-4" />
                        <span>Summary</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          deleteContact.mutate({ contactId: contact.id })
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ExportContacts({ contacts }: { contacts: ContactData[] }) {
  function formatDate(date: Date) {
    try {
      // YYYY-MM-DD format
      return date.toISOString().split('T')[0]
    } catch (error) {
      return ''
    }
  }

  function handleExport(): void {
    try {
      // Define CSV headers
      const headers = [
        'ID',
        'Name',
        'Email',
        'Created Date',
        'Workspace ID',
        'Company',
        'Last Contacted'
      ]

      // Convert contacts to CSV rows
      const csvRows = contacts.map((contact) => [
        contact.id,
        contact.name || '', // Handle null names
        contact.email,
        formatDate(contact.createdAt),
        contact.workspaceId,
        contact.company || '', // Handle null companies
        formatDate(contact.lastContactedAt)
      ])

      // Combine headers and rows
      const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n')

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `contacts_export_${formatDate(new Date())}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting contacts:', error)
    }
  }

  return (
    <Button onClick={handleExport} variant="default">
      Export
    </Button>
  )
}
