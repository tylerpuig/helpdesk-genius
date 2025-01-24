'use client'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'

const COLORS = ['#CF4747', '#E68A5C', '#0088FE']

export const ticketTypes = [
  { name: 'High Priority', value: 25 },
  { name: 'Medium Priority', value: 40 },
  { name: 'Low Priority', value: 35 }
]

const ticketKeyToRenderText: Record<string, string> = {
  highPriority: 'High Priority',
  mediumPriority: 'Medium Priority',
  lowPriority: 'Low Priority'
}

export function TicketPieChart() {
  const { selectedWorkspaceId } = useWorkspace()
  const { data: ticketCounts } = api.metrics.getTicketCountsByType.useQuery({
    workspaceId: selectedWorkspaceId
  })

  const ticketData = ticketCounts ?? ({} as Record<string, string>)

  const results = Object.entries(ticketKeyToRenderText).map(([key, name]) => {
    return {
      name,
      value: ticketData?.[key as keyof typeof ticketData] ?? 0
    }
  })

  return (
    <Card className="sm:col-span-4 md:col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Ticket Types</CardTitle>
      </CardHeader>
      <CardContent className="aspect-square w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={results}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              isAnimationActive={false}
            >
              {results.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#8D73E0',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              // wrapperStyle={{ outline: 'none' }}
              formatter={(value) => [`${value} tickets`]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
