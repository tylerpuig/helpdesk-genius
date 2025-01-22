'use client'

import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { api } from '~/trpc/react'

export function CreateTeam() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [teamName, setTeamName] = useState('')

  const { refetch } = api.teams.getUserTeams.useQuery(undefined, {
    enabled: false
  })

  const createTeam = api.teams.createTeam.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  function handleCreateTeam(e: React.FormEvent): void {
    e.preventDefault()
    createTeam.mutate({ name: teamName })
    setTeamName('')
    setIsDialogOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <p className="mb-4 text-xl">No teams available yet</p>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Create Team</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
