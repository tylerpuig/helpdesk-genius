'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { api } from '~/trpc/react'
import { useEffect, useState } from 'react'
import { useAgentStore } from './useAgentStore'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { useWorkspace } from '~/hooks/context/useWorkspaces'

export default function AgentKnowledgeSheet({ params }: { params: { agentId: string } }) {
  const {
    agentKnowledgeSheetOpen,
    setAgentKnowledgeSheetOpen,
    selectedKnowledgeId,
    setSelectedKnowledgeId
  } = useAgentStore()
  const { selectedWorkspaceId } = useWorkspace()

  const [knowledge, setKnowledge] = useState('')
  const isEditingKnowledge = selectedKnowledgeId !== ''

  const { data: knowledgeData } = api.agents.getSingleAgentKnowledge.useQuery(
    {
      agentId: params.agentId,
      knowledgeId: selectedKnowledgeId
    },
    {
      enabled: selectedKnowledgeId !== ''
    }
  )

  const { refetch: refetchKnowledge } = api.agents.getAgentKnowledge.useQuery(
    {
      agentId: params.agentId,
      workspaceId: selectedWorkspaceId
    },
    {
      enabled: false
    }
  )

  function handleUpdateKnowledge(): void {
    setAgentKnowledgeSheetOpen(false)
    setKnowledge('')
    setSelectedKnowledgeId('')
    refetchKnowledge()
  }

  const updateAgentKnowledge = api.agents.updateAgentKnowledge.useMutation({
    onSuccess: () => {
      handleUpdateKnowledge()
    }
  })

  useEffect(() => {
    if (knowledgeData) {
      setKnowledge(knowledgeData.rawContent)
    }
  }, [knowledgeData?.rawContent])

  return (
    <Sheet
      open={agentKnowledgeSheetOpen}
      onOpenChange={(open) => {
        setAgentKnowledgeSheetOpen(open)
        if (!open) {
          setKnowledge('')
          setSelectedKnowledgeId('')
        }
      }}
    >
      {/* <SheetHeader></SheetHeader> */}
      <SheetContent className="">
        <SheetTitle className="text-white">
          {isEditingKnowledge ? 'Edit Knowledge' : 'Add Knowledge'}
        </SheetTitle>
        <div className="mt-8 space-y-2">
          <Label htmlFor="knowledge">Knowledge Content</Label>
          <Textarea
            value={knowledge}
            onChange={(e) => setKnowledge(e.target.value)}
            className="min-h-[500px]"
          />
        </div>
        <Button
          onClick={() => {
            updateAgentKnowledge.mutate({
              agentId: params.agentId,
              knowledgeContent: knowledge,
              knowledgeId: selectedKnowledgeId
            })
          }}
          variant="default"
          className="mt-4 w-full"
        >
          {isEditingKnowledge ? 'Update' : 'Save'}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
