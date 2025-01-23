'use client'
import { TRPCReactProvider } from '~/trpc/react'
import { SessionProvider } from 'next-auth/react'
import { WorkspacesProvider } from '~/hooks/context/useWorkspaces'

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <TRPCReactProvider>
      <SessionProvider>
        <WorkspacesProvider>{children}</WorkspacesProvider>
      </SessionProvider>
    </TRPCReactProvider>
  )
}
