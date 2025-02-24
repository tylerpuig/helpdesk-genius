'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Label } from '~/components/ui/label'
import { MoreVertical, Pencil, Trash, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { api } from '~/trpc/react'
import { useTeamManagementStore } from './useTeamManagementStore'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { WorkspaceInvitationStatus, type WorkspaceRole } from '~/server/db/types'
import { useWorkspace } from '~/hooks/context/useWorkspaces'

const roleToRenderText: Record<WorkspaceRole, string> = {
  member: 'Member',
  admin: 'Admin',
  owner: 'Owner'
}

export default function UserManagementTable() {
  const { selectedWorkspaceId } = useWorkspace()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const { data, isPending } = api.workspace.getTeamMembers.useQuery({
    workspaceId: selectedWorkspaceId
  })

  const { members: teamMembers, role } = data ?? {}

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="mb-4 text-2xl font-bold">Team Management</h1>
        <AddUserDialog
          isAddDialogOpen={isAddDialogOpen}
          setIsAddDialogOpen={setIsAddDialogOpen}
          role={role}
        />
      </div>
      <Table>
        <TableHeader className="sticky top-0 bg-gray-900">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending && !teamMembers && (
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
          {teamMembers &&
            teamMembers.map((member) => (
              <TableRow key={member?.invitation?.expiresAt.toString()}>
                <TableCell>{member.user?.name ?? ''}</TableCell>
                <TableCell>{member.user?.email ?? ''}</TableCell>
                <TableCell>{roleToRenderText?.[member?.member?.role] ?? ''}</TableCell>
                <TableCell>
                  <TeamMemberStatus status={member?.invitation?.status} />
                  {/* {member?.invitation?.status ?? 'Active'} */}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={role === 'member'} variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem>
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

export function TeamMemberStatus({ status }: { status: WorkspaceInvitationStatus | undefined }) {
  switch (status) {
    case 'pending':
      return <Badge variant="teamMemberPending">Pending</Badge>
    case 'accepted':
      return <Badge variant="teamMemberActive">Active</Badge>
    case 'rejected':
      return <Badge variant="teamMemberInactive">Inactive</Badge>
    case 'expired':
      return <Badge variant="destructive">Expired</Badge>
    default:
      return <Badge variant="teamMemberActive">Active</Badge>
  }
}

function AddUserDialog({
  isAddDialogOpen,
  setIsAddDialogOpen,
  role
}: {
  isAddDialogOpen: boolean
  setIsAddDialogOpen: (isOpen: boolean) => void
  role: WorkspaceRole | undefined
}) {
  const { selectedTeamId } = useTeamManagementStore()
  const [newUser, setNewUser] = useState<{ email: string; role: WorkspaceRole }>({
    email: '',
    role: 'member'
  })

  const { refetch: refetchTeamInvitations } = api.workspace.getTeamInvitations.useQuery(
    {
      workspaceId: selectedTeamId
    },
    { enabled: false }
  )

  const inviteUser = api.workspace.inviteUser.useMutation({
    onSettled: () => {
      setIsAddDialogOpen(false)
      refetchTeamInvitations()
    }
  })

  return (
    <Dialog
      open={isAddDialogOpen}
      onOpenChange={(open) => {
        if (!open) setNewUser({ email: '', role: 'member' })
        setIsAddDialogOpen(open)
      }}
    >
      <DialogTrigger asChild disabled={role === 'member'}>
        <Button className="mb-4">Add User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <Select
              value={newUser.role}
              onValueChange={(value) => setNewUser({ ...newUser, role: value as WorkspaceRole })}
            >
              <SelectTrigger className="">
                <SelectValue placeholder="Role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex w-full">
          <Button
            className="w-full"
            onClick={() => {
              if (!selectedTeamId) return
              inviteUser.mutate({
                workspaceId: selectedTeamId,
                email: newUser.email,
                role: newUser.role
              })
            }}
          >
            Invite User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
