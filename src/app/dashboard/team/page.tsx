'use client'

import { useEffect } from 'react'
import UserManagementTable from '~/app/_components/team/team-table/team-table'
import TeamInvitationsTable from '~/app/_components/team/team-table/team-invitations-table'
import { api } from '~/trpc/react'
import { CreateTeam } from '~/app/_components/team/create-team'
import { useTeamManagementStore } from '~/app/_components/team/team-table/useTeamManagementStore'

export default function TeamManagementPage() {
  const { selectedTeamId, updateSelectedTeamId } = useTeamManagementStore((state) => state)
  const { data: userTeams, isPending } = api.teams.getUserTeams.useQuery()

  useEffect(() => {
    if (userTeams && !selectedTeamId && userTeams?.[0]?.id) {
      updateSelectedTeamId(userTeams[0].id)
    }
  }, [userTeams])

  if (isPending) return null

  return (
    <>
      {userTeams && userTeams.length > 0 ? (
        <div className="space-y-20">
          <UserManagementTable />
          <TeamInvitationsTable />
        </div>
      ) : (
        <CreateTeam />
      )}
    </>
  )
}
