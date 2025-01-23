'use client'
import { WorkspacesProvider } from '~/hooks/context/useWorkspaces'

export function DashboardProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return <WorkspacesProvider>{children}</WorkspacesProvider>
}
