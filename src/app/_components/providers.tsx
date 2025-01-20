'use client'
import { TRPCReactProvider } from '~/trpc/react'
import { MessagesProvider } from '~/hooks/context/useMessages'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <TRPCReactProvider>
      <SessionProvider>
        <MessagesProvider>{children}</MessagesProvider>
      </SessionProvider>
    </TRPCReactProvider>
  )
}
