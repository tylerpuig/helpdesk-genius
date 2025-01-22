import { useEffect, createContext, useState, useContext } from 'react'
import { api } from '~/trpc/react'

type WorkspaceContextType = {
  selectedWorkspaceId: string
  setSelectedWorkspaceId(id: string): void
}

const WorkspacesContext = createContext<WorkspaceContextType>({
  selectedWorkspaceId: '',
  setSelectedWorkspaceId: () => {}
})

export function WorkspacesProvider({ children }: { children: React.ReactNode }) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
  const createNewWorkspace = api.workspace.createWorkspace.useMutation()

  const { data: workspacesList, refetch: refetchWorkspaces } =
    api.workspace.getUserWorkspaces.useQuery()

  useEffect(() => {
    if (workspacesList && !workspacesList?.length) {
      ;(async () => {
        await createNewWorkspace.mutateAsync({
          name: 'My Workspace'
        })
        refetchWorkspaces()
      })()
    }
  }, [workspacesList])

  useEffect(() => {
    if (workspacesList && !selectedWorkspaceId && workspacesList?.[0]?.id) {
      setSelectedWorkspaceId(workspacesList[0].id)
    }
  }, [workspacesList])

  return (
    <WorkspacesContext.Provider
      value={{
        selectedWorkspaceId,
        setSelectedWorkspaceId
      }}
    >
      {children}
    </WorkspacesContext.Provider>
  )
}

export function useWorkspace() {
  return useContext(WorkspacesContext)
}
