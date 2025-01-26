import AgentDetails from '~/app/_components/agents/agent-details'

export default async function Page({ params }: { params: { agentId: string } }) {
  const resolvedParams = await params
  return <AgentDetails params={resolvedParams} />
}
