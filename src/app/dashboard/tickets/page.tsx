// 'use client'
import { Mail } from '~/app/_components/mail/mail'
import { redirect } from 'next/navigation'
import { auth } from '~/server/auth'
import ManageTagsSheet from '~/app/_components/mail/utilities/tags/manage-tags'

export default async function Page() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
      <Mail defaultLayout={[20, 32, 48]} navCollapsedSize={48} />
      <ManageTagsSheet />
    </div>
  )
}
