'use client'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { api } from '~/trpc/react'

export function TicketLineChart() {
  const { data: ticketsCreatedLast7Days } = api.metrics.getTicketsCreatedLast7Days.useQuery()

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Tickets Over Time</CardTitle>
      </CardHeader>
      <CardContent className="aspect-[2/1] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ticketsCreatedLast7Days ?? []}>
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            {/* <XAxis dataKey="date" /> */}
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                const formattedDate = new Date(date).toLocaleDateString()
                const splitDate = formattedDate.split('/')
                // console.log(splitDate)
                return `${splitDate[0]}-${splitDate[1]}`
                // return formattedDate
              }}
            />
            <YAxis dataKey="count" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1b1e',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              wrapperStyle={{ outline: 'none' }}
              formatter={(value) => [`${value} tickets`]}
              labelFormatter={(label) => {
                const date = new Date(label).toLocaleDateString()
                const splitDate = date.split('/')
                return `${splitDate[0]}-${splitDate[1]}`
              }}
            />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
