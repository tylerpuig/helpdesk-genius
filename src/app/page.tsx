import { HydrateClient } from '~/trpc/server'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { auth } from '~/server/auth'

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  } else {
    redirect('/dashboard')
  }

  return (
    <HydrateClient>
      <main className=""></main>
    </HydrateClient>
  )
}
