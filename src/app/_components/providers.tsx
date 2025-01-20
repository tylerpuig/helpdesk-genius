'use client'
import { TRPCReactProvider } from '~/trpc/react'
import { MessagesProvider } from '~/hooks/context/useMessages'

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <TRPCReactProvider>
      <MessagesProvider>
        {/* Add other providers here */}
        {children}
      </MessagesProvider>
    </TRPCReactProvider>
  )
}
