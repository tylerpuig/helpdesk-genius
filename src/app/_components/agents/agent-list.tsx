'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { useAgentStore } from '~/app/_components/agents/useAgentStore'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { useToast } from '~/hooks/use-toast'
import { Textarea } from '~/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AgentList() {
  const router = useRouter()
  const { selectedWorkspaceId } = useWorkspace()
  const { setSelectedAgentId, setAddNewAgentDialogOpen } = useAgentStore()

  const { data: agents, refetch: refetchAgents } = api.agents.getWorkspaceAgents.useQuery({
    workspaceId: selectedWorkspaceId
  })

  const deleteAgent = api.agents.deleteAgent.useMutation({
    onSuccess: () => {
      refetchAgents()
    }
  })

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agents</h1>
        <Button
          onClick={() => {
            setAddNewAgentDialogOpen(true)
          }}
          variant="default"
          className=""
        >
          New Agent
        </Button>
      </div>
      <NewAgentDialog />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents &&
          agents.map((agent) => (
            <Card
              key={agent.id}
              className="relative transition-shadow duration-300 hover:shadow-lg"
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => {
                  setSelectedAgentId(agent.id)
                  router.push(`/dashboard/agents/${agent.id}`)
                }}
              >
                <CardTitle className="mb-2 text-xl">{agent.title}</CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <div className="absolute right-2 top-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedAgentId(agent.id)
                        setAddNewAgentDialogOpen(true)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        deleteAgent.mutate({ agentId: agent.id, workspaceId: selectedWorkspaceId })
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
      </div>
    </div>
  )
}

function NewAgentDialog() {
  const { addNewAgentDialogOpen, setAddNewAgentDialogOpen, selectedAgentId, setSelectedAgentId } =
    useAgentStore()
  const { selectedWorkspaceId } = useWorkspace()
  const { toast } = useToast()
  const [agentDetails, setAgentDetails] = useState<{
    name: string
    description: string
  }>({
    name: '',
    description: ''
  })

  const { refetch: refetchAgents } = api.agents.getWorkspaceAgents.useQuery(
    {
      workspaceId: selectedWorkspaceId
    },
    {
      enabled: false
    }
  )

  const { data: agentInfo } = api.agents.getAgentDetails.useQuery(
    {
      agentId: selectedAgentId,
      workspaceId: selectedWorkspaceId
    },
    {
      enabled: selectedAgentId !== ''
    }
  )

  useEffect(() => {
    if (selectedAgentId && agentInfo) {
      setAgentDetails({
        name: agentInfo.title,
        description: agentInfo.description
      })
    }
  }, [agentInfo])

  function handleAgentUpdate(): void {
    refetchAgents()
    setAgentDetails({
      name: '',
      description: ''
    })
    setSelectedAgentId('')
    setAddNewAgentDialogOpen(false)
  }

  const createAgent = api.agents.createWorkspaceAgent.useMutation({
    onSuccess: () => {
      handleAgentUpdate()
    }
  })

  const updateAgent = api.agents.updateAgentDetails.useMutation({
    onSuccess: () => {
      handleAgentUpdate()
    }
  })

  return (
    <>
      <Dialog
        open={addNewAgentDialogOpen}
        onOpenChange={(open) => {
          setAddNewAgentDialogOpen(open)

          if (!open) {
            handleAgentUpdate()
          }
        }}
      >
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>{selectedAgentId ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Agent Name</Label>
              <Input
                id="agentName"
                type="text"
                value={agentDetails.name}
                onChange={(e) => {
                  setAgentDetails((prev) => ({
                    ...prev,
                    name: e.target.value
                  }))
                }}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Agent Description</Label>
              <Textarea
                id="agentDescription"
                value={agentDetails.description}
                onChange={(e) => {
                  setAgentDetails((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }}
                required
              />
            </div>
          </div>
          <div className="flex w-full">
            <Button
              className="w-full"
              onClick={() => {
                if (!agentDetails.name) {
                  toast({
                    title: 'Error',
                    description: 'Please enter a name for the agent.',
                    variant: 'destructive',
                    duration: 4_000
                  })
                  return
                }

                if (!agentDetails.description) {
                  toast({
                    title: 'Error',
                    description: 'Please enter a description for the agent.',
                    variant: 'destructive',
                    duration: 4_000
                  })
                  return
                }

                if (selectedAgentId) {
                  updateAgent.mutate({
                    agentId: selectedAgentId,
                    workspaceId: selectedWorkspaceId,
                    title: agentDetails.name,
                    description: agentDetails.description
                  })
                } else {
                  createAgent.mutate({
                    workspaceId: selectedWorkspaceId,
                    title: agentDetails.name,
                    description: agentDetails.description
                  })
                }
              }}
            >
              {selectedAgentId ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
