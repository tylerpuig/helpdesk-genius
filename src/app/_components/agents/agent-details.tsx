'use client'

import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { ChevronLeft, MoreVertical, Edit, Copy, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { useAgentStore } from '~/app/_components/agents/useAgentStore'
import AgentKnowledgeSheet from '~/app/_components/agents/add-knowledge-sheet'

export default function AgentDetails({ params }: { params: { agentId: string } }) {
  const router = useRouter()
  if (!params.agentId) return null

  const { setAgentKnowledgeSheetOpen, setSelectedKnowledgeId } = useAgentStore()
  const { selectedWorkspaceId } = useWorkspace()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const { data: agentInfo } = api.agents.getAgentDetails.useQuery({
    agentId: params.agentId,
    workspaceId: selectedWorkspaceId
  })

  const { data: agentKnowledge, refetch: refetchAgentKnowledge } =
    api.agents.getAgentKnowledge.useQuery({
      agentId: params.agentId,
      workspaceId: selectedWorkspaceId
    })

  const deleteAgentKnowledge = api.agents.deleteAgentKnowledge.useMutation({
    onSuccess: () => {
      refetchAgentKnowledge()
    }
  })

  function toggleAccordion(value: string): void {
    setExpandedItems((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  function handleBack(): void {
    router.back()
  }

  return (
    <div className="space-y-6 px-4">
      <AgentKnowledgeSheet params={params} />
      <Button onClick={handleBack} variant="outline" className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Agents
      </Button>
      <div className="flex justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold">{agentInfo?.title ?? ''}</h2>
          <p className="text-gray-300">{agentInfo?.description ?? ''}</p>
        </div>
        <Button
          onClick={() => {
            setAgentKnowledgeSheetOpen(true)
          }}
          variant="default"
          className="mb-4"
        >
          Add Knowledge
        </Button>
      </div>
      <div>
        <h3 className="mb-4 text-2xl font-semibold">Knowledge Base</h3>
        <Accordion type="multiple" value={expandedItems} className="space-y-4">
          {agentKnowledge &&
            agentKnowledge.map((item) => (
              <AccordionItem className="border-0" key={item.id} value={item.id}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <AccordionTrigger
                      iconClassName="h-5 w-5 shrink-0 transition-transform duration-200"
                      onClick={() => toggleAccordion(item.id)}
                      className="hover:no-underline"
                    >
                      <CardTitle className="mr-1 text-lg">{item.rawContentSummary ?? ''}</CardTitle>
                    </AccordionTrigger>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedKnowledgeId(item.id)
                              setAgentKnowledgeSheetOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              deleteAgentKnowledge.mutate({ knowledgeId: item.id })
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent>
                      <p className="text-gray-200">{item.rawContent ?? ''}</p>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
        </Accordion>
      </div>
    </div>
  )
}
