'use client'
import { TRPCReactProvider } from '~/trpc/react'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <TRPCReactProvider>
      <SessionProvider>{children}</SessionProvider>
    </TRPCReactProvider>
  )
}
