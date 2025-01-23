'use client'

import { useState } from 'react'
import { ChevronsUpDown, Plus, Box } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '~/components/ui/sidebar'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { api } from '~/trpc/react'
import { Skeleton } from '~/components/ui/skeleton'

export function WorkspaceSwitcher() {
  const { data: workspaces } = api.workspace.getUserWorkspaces.useQuery()
  const {
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    newWorkspaceDialogOpen,
    setNewWorkspaceDialogOpen
  } = useWorkspace()
  // const [newWorkspaceDialogOpen, setNewWorkspaceDialogOpen] = useState(false)
  const { isMobile } = useSidebar()

  const currentWorkspace = (workspaces || []).find(
    (workspace) => workspace.id === selectedWorkspaceId
  )

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Box className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {currentWorkspace?.name ? (
                    <span className="truncate font-semibold">{currentWorkspace?.name ?? ''}</span>
                  ) : (
                    <Skeleton className="mb-2 h-2 w-[75%]" />
                  )}
                  {currentWorkspace?.slug ? (
                    <span className="truncate text-xs">{currentWorkspace?.slug ?? ''}</span>
                  ) : (
                    <Skeleton className="h-2 w-[50%]" />
                  )}

                  {/* <span className="truncate text-xs">{currentWorkspace?.slug ?? ''}</span> */}
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces &&
                workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.name}
                    onClick={() => {
                      if (!workspace.id) return
                      setSelectedWorkspaceId(workspace.id)
                    }}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Box className="size-4" />
                    </div>
                    {workspace.name}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setNewWorkspaceDialogOpen(true)
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add Workspace</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}

export function NewWorkspaceDialog() {
  const { newWorkspaceDialogOpen, setNewWorkspaceDialogOpen } = useWorkspace()
  const [workspaceName, setWorkspaceName] = useState('')

  const { refetch: refetchWorkspaces } = api.workspace.getUserWorkspaces.useQuery(undefined, {
    enabled: false
  })

  const createWorkspace = api.workspace.createWorkspace.useMutation({
    onSuccess: () => {
      refetchWorkspaces()
      setNewWorkspaceDialogOpen(false)
    }
  })

  return (
    <Dialog
      open={newWorkspaceDialogOpen}
      onOpenChange={(open) => {
        if (!open) setWorkspaceName('')
        setNewWorkspaceDialogOpen(open)
      }}
    >
      {/* <DialogTrigger asChild>
        <Button className="mb-4">Add User</Button>
      </DialogTrigger> */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Name</Label>
            <Input
              id="workspaceName"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex w-full">
          <Button
            className="w-full"
            onClick={() => {
              if (!workspaceName) return
              createWorkspace.mutate({
                name: workspaceName
              })
            }}
          >
            Create Workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
