'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { MoreVertical, Trash } from 'lucide-react'
import { api } from '~/trpc/react'
import { useTeamManagementStore } from './useTeamManagementStore'
import type { TeamRole } from '~/server/db/types'
import { Skeleton } from '~/components/ui/skeleton'
import { TeamMemberStatus } from '~/app/_components/team/team-table/team-table'

const roleToRenderText: Record<TeamRole, string> = {
  member: 'Member',
  admin: 'Admin',
  owner: 'Owner'
}

export default function TeamInvitationsTable() {
  const { selectedTeamId } = useTeamManagementStore((state) => state)

  const {
    data: teamInvitations,
    isPending,
    refetch
  } = api.teams.getTeamInvitations.useQuery({
    teamId: selectedTeamId
  })

  const deleteTeamInvitation = api.teams.deleteTeamInvitation.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Active Invitations</h1>

      <Table>
        <TableHeader className="sticky top-0 bg-gray-900">
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending && !teamInvitations && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}
          {teamInvitations &&
            teamInvitations.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>{invite.email ?? ''}</TableCell>
                <TableCell>{roleToRenderText?.[invite?.role] ?? ''}</TableCell>
                <TableCell>
                  <TeamMemberStatus status={invite?.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          deleteTeamInvitation.mutate({
                            teamId: selectedTeamId,
                            invitationId: invite.id
                          })
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
