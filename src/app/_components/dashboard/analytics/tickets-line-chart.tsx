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

interface LineChartProps {
  data: { date: string; count: number }[]
}

export function TicketLineChart({ data }: LineChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Tickets Over Time</CardTitle>
      </CardHeader>
      <CardContent className="aspect-[2/1] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
