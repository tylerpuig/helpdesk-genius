// 'use client'
import { StatCard } from '~/app/_components/dashboard/analytics/ticket-stat-card'
import { TicketLineChart } from '~/app/_components/dashboard/analytics/tickets-line-chart'
import { TicketPieChart } from '~/app/_components/dashboard/analytics/ticket-pie-chart'
import { TicketTable } from '~/app/_components/dashboard/analytics/ticket-table'
import { ticketData, ticketTypes, latestTickets } from '~/app/_components/dashboard/analytics/data'

export default function Page() {
  return <Dashboard />
}

function Dashboard() {
  const pendingTickets = 15

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Tickets"
          value={pendingTickets}
          description="Total number of open tickets"
        />
        <StatCard title="Avg. Response Time" value={2.5} description="Hours" />
        <StatCard
          title="Tickets Resolved Today"
          value={23}
          description="Total resolved in last 24 hours"
        />
        <StatCard title="Customer Satisfaction" value={94} description="Percentage" />
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <TicketLineChart data={ticketData} />
        <TicketPieChart data={ticketTypes} />
      </div>
      <TicketTable tickets={latestTickets} />
    </div>
  )
}
