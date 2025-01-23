'use client'
import { StatCard } from '~/app/_components/dashboard/analytics/ticket-stat-card'
import { TicketLineChart } from '~/app/_components/dashboard/analytics/tickets-line-chart'
import { TicketPieChart } from '~/app/_components/dashboard/analytics/ticket-pie-chart'
import { TicketTable } from '~/app/_components/dashboard/analytics/ticket-table'
import { ticketTypes } from '~/app/_components/dashboard/analytics/data'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { api } from '~/trpc/react'

export default function Page() {
  return <Dashboard />
}

function Dashboard() {
  const { selectedWorkspaceId } = useWorkspace()
  const { data: ticketMetrics, isPending } = api.metrics.getTodayTicketMetrics.useQuery(
    {
      workspaceId: selectedWorkspaceId
    },
    {
      enabled: selectedWorkspaceId !== ''
    }
  )

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Tickets"
          value={ticketMetrics?.pendingTicketCount ?? 0}
          isLoading={isPending}
          description="Total number of open tickets"
        />
        <StatCard
          title="Avg. Response Time"
          isLoading={isPending}
          value={ticketMetrics?.avgResponseTimeHours ?? 0}
          description="Hours"
        />
        <StatCard
          title="Tickets Resolved Today"
          isLoading={isPending}
          value={ticketMetrics?.totalTicketsResolved ?? 0}
          description="Total resolved in last 24 hours"
        />
        <StatCard
          isLoading={isPending}
          value={94}
          title="Customer Satisfaction"
          description="Percentage"
        />
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <TicketLineChart />
        <TicketPieChart data={ticketTypes} />
      </div>
      <TicketTable />
    </div>
  )
}
