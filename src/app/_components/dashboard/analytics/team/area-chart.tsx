'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { type DailyUserMetric } from '~/server/db/utils/metrics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '~/components/ui/chart'

const chartConfig = {
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))'
  }
} satisfies ChartConfig

export type UserMetricKeys = {
  threadMetrics: keyof DailyUserMetric['threadMetrics']
  messageMetrics: keyof DailyUserMetric['messageMetrics']
}

export function MemberAreaChart({
  data,
  mainKey,
  subKey,
  title,
  description
}: {
  data: DailyUserMetric[]
  mainKey: keyof Pick<DailyUserMetric, 'threadMetrics' | 'messageMetrics'>
  subKey: UserMetricKeys[keyof Pick<DailyUserMetric, 'threadMetrics' | 'messageMetrics'>]
  title: string
  description: string
}) {
  const formattedData = useMemo(() => {
    // if (!data) return []
    return data.map((el) => ({
      date: el.date,
      value: (el[mainKey]?.[subKey as keyof (typeof el)[typeof mainKey]] ?? 0) as number
    }))
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description ?? ''}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={formattedData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area
              dataKey="value"
              type="natural"
              fill="var(--color-mobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            />
            {/* <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              stackId="a"
            /> */}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
