'use client'

import * as React from 'react'
import { Search } from 'lucide-react'

// import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { TooltipProvider } from '~/components/ui/tooltip'
// import { AccountSwitcher } from '~/app/_components/mail/account-switcher'
import { EmailMessagesDisplay } from '~/app/_components/mail/messages-display'
import { MailList } from '~/app/_components/mail/thread-list'
// import { Nav } from '~/app/_components/mail/nav'
import FilterThread, { FilterThreadByPriority } from '~/app/_components/mail/thread/filter-thread'
import { EmailForwardDialog } from '~/app/_components/mail/utilities/forward-email-message/forward-email-message'

type MailProps = {
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

export function Mail({
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize
}: MailProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(sizes)}`
        }}
        className="h-full max-h-screen items-stretch"
      >
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <div className="flex gap-2">
                <FilterThreadByPriority />
                <FilterThread />
              </div>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            {/* <TabsContent value="all" className="m-0"> */}
            <MailList />
            {/* </TabsContent> */}
            {/* <TabsContent value="unread" className="m-0"> */}
            {/* <MailList /> */}
            {/* </TabsContent> */}
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <EmailMessagesDisplay />
        </ResizablePanel>
      </ResizablePanelGroup>
      <EmailForwardDialog />
    </TooltipProvider>
  )
}
