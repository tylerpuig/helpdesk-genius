'use client'

import { useState, useMemo } from 'react'
import {
  MemberAreaChart,
  type UserMetricKeys
} from '~/app/_components/dashboard/analytics/team/area-chart'
import { Select, SelectItem, SelectTrigger, SelectContent } from '~/components/ui/select'
import { api } from '~/trpc/react'
import { useSession } from 'next-auth/react'
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
export default function ViewMemmberAnalytics() {
  const { selectedWorkspaceId } = useWorkspace()
  const [selectedMemberUserId, setSelectedMemberUserId] = useState('')

  const { data: members } = api.workspace.getTeamMembersForAnalytics.useQuery({
    workspaceId: selectedWorkspaceId
  })

  const { data: dailyUserMetrics } = api.metrics.getDailyUserMetrics.useQuery(
    {
      workspaceId: selectedWorkspaceId,
      days: 30,
      userId: selectedMemberUserId
    },
    {
      enabled: selectedMemberUserId !== ''
    }
  )

  const selectedUser = members?.find((member) => member.userId === selectedMemberUserId)

  if (dailyUserMetrics) {
    console.log(dailyUserMetrics)
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between">
        <h1 className="mb-8 text-3xl font-bold">Team Analytics</h1>
        <div className="flex gap-4">
          <Select>
            <SelectTrigger className="w-[120px]">Test</SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
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
            data={dailyUserMetrics ?? []}
            mainKey={el.mainKey}
            subKey={el.subKey}
          />
        ))}
      </div>
    </div>
  )
}
