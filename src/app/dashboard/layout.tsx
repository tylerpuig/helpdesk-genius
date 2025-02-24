// 'use client'
import { AppSidebar } from '~/app/_components/dashboard/app-sidebar'
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator
// } from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { redirect } from 'next/navigation'
import { auth } from '~/server/auth'
import { DashboardProviders } from '~/app/_components/dashboard/dashboard-providers'
import { NewWorkspaceDialog } from '~/app/_components/dashboard/workspace-switcher'

export default async function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <SidebarProvider>
      <DashboardProviders>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
            </div>
          </header>
          {children}
        </SidebarInset>
        <NewWorkspaceDialog />
      </DashboardProviders>
    </SidebarProvider>
  )
}
