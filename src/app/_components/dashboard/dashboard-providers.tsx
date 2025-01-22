'use client'
import { MessagesProvider } from '~/hooks/context/useMessages'
import { WorkspacesProvider } from '~/hooks/context/useWorkspaces'

export function DashboardProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <WorkspacesProvider>
      <MessagesProvider>{children}</MessagesProvider>
    </WorkspacesProvider>
  )
}
