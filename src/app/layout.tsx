import '~/styles/globals.css'

import { GeistSans } from 'geist/font/sans'
import { type Metadata } from 'next'
import { TRPCReactProvider } from '~/trpc/react'
import { Providers } from '~/app/_components/providers'

export const metadata: Metadata = {
  title: 'Helpdesk Genius',
  description: 'Use AT to automate your helpdesk',
  icons: [{ rel: 'icon', url: '/favicon.ico' }]
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} dark`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
