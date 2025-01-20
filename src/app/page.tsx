import Link from 'next/link'

import { auth } from '~/server/auth'
import { api, HydrateClient } from '~/trpc/server'

export default async function Home() {
  const session = await auth()

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white"></main>
    </HydrateClient>
  )
}
