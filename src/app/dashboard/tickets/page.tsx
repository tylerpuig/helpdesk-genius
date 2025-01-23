// 'use client'
import { Mail } from '~/app/_components/mail/mail'
import { redirect } from 'next/navigation'
import { auth } from '~/server/auth'

export default async function Page() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
      {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div> */}
      {/* <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
      <Mail defaultLayout={[20, 32, 48]} navCollapsedSize={48} />
    </div>
  )
}
