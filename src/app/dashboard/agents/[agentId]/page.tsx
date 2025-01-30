import AgentDetails from '~/app/_components/agents/agent-details'

interface PageProps {
  params: Promise<{ agentId: string }>
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params
  return <AgentDetails params={resolvedParams} />
}
