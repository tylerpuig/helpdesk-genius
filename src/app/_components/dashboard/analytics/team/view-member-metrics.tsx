'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  MemberAreaChart,
  type UserMetricKeys
} from '~/app/_components/dashboard/analytics/team/area-chart'
import { Select, SelectItem, SelectTrigger, SelectContent } from '~/components/ui/select'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { type DailyUserMetric } from '~/server/db/utils/metrics'

const charts: {
  mainKey: keyof Pick<DailyUserMetric, 'threadMetrics' | 'messageMetrics'>
  subKey: UserMetricKeys[keyof Pick<DailyUserMetric, 'threadMetrics' | 'messageMetrics'>]
  title: string
}[] = [
  {
    mainKey: 'threadMetrics',
    subKey: 'totalThreads',
    title: 'Total Threads'
  },
  {
    mainKey: 'threadMetrics',
    subKey: 'resolvedThreads',
    title: 'Resolved Threads'
  },
  {
    mainKey: 'threadMetrics',
    subKey: 'resolutionRate',
    title: 'Resolution Rate'
  },
  {
    mainKey: 'messageMetrics',
    subKey: 'totalMessages',
    title: 'Total Messages'
  },
  {
    mainKey: 'messageMetrics',
    subKey: 'responseRate',
    title: 'Response Rate'
  },
  {
    mainKey: 'messageMetrics',
    subKey: 'agentMessages',
    title: 'Agent Messages'
  },
  {
    mainKey: 'messageMetrics',
    subKey: 'customerMessages',
    title: 'Customer Messages'
  }
]

const daysDurationOptions = [
  { value: 3, label: '3 Days' },
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' }
]
export default function ViewMemmberAnalytics() {
  const { selectedWorkspaceId } = useWorkspace()
  const [selectedMemberUserId, setSelectedMemberUserId] = useState('')
  const [daysDuration, setDaysDuration] = useState(30)

  const { data: members } = api.workspace.getTeamMembersForAnalytics.useQuery({
    workspaceId: selectedWorkspaceId
  })

  useEffect(() => {
    if (!selectedMemberUserId && members?.[0]?.userId) {
      setSelectedMemberUserId(members[0].userId)
    }
  }, [members])

  const { data: dailyUserMetrics } = api.metrics.getDailyUserMetrics.useQuery(
    {
      workspaceId: selectedWorkspaceId,
      days: daysDuration,
      userId: selectedMemberUserId
    },
    {
      enabled: selectedMemberUserId !== ''
    }
  )

  const previousMetricsRef = useRef<DailyUserMetric[]>([])
  const metrics = useMemo(() => {
    if (dailyUserMetrics) {
      previousMetricsRef.current = dailyUserMetrics
      return dailyUserMetrics
    }
    return previousMetricsRef.current
  }, [dailyUserMetrics])

  const selectedUser = members?.find((member) => member.userId === selectedMemberUserId)
  const selectedDaysDuration = daysDurationOptions.find((option) => option.value === daysDuration)

  return (
    <div className="px-4">
      <div className="flex items-center justify-between">
        <h1 className="mb-8 text-3xl font-bold">Team Analytics</h1>
        <div className="flex gap-4">
          <Select
            value={selectedDaysDuration?.value.toString()}
            onValueChange={(val) => setDaysDuration(Number(val))}
          >
            <SelectTrigger className="w-[120px]">{selectedDaysDuration?.label}</SelectTrigger>
            <SelectContent>
              {daysDurationOptions.map((el) => (
                <SelectItem key={el.value} value={el.value.toString()}>
                  {el.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedMemberUserId}
            onValueChange={(val) => setSelectedMemberUserId(val)}
          >
            <SelectTrigger className="w-[240px]">
              {selectedUser?.name ?? 'Select a user'}
            </SelectTrigger>
            <SelectContent>
              {members &&
                members.map((el) => (
                  <SelectItem key={el.id} value={el.userId ?? ''}>
                    {el.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {charts.map((el) => (
          <MemberAreaChart
            title={el.title}
            key={el.title}
            data={metrics}
            mainKey={el.mainKey}
            subKey={el.subKey}
            description={`Showing total ${el.title} for the last ${daysDuration} days`}
          />
        ))}
      </div>
    </div>
  )
}
