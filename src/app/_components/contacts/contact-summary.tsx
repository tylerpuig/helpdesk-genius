'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { api } from '~/trpc/react'
import { useEffect, useState } from 'react'
import { useContactStore } from './useContactStore'
import { ScrollArea } from '~/components/ui/scroll-area'
import MarkdownPreview from '@uiw/react-markdown-preview'

export default function ContactSummary() {
  const { selectedContactEmail, contactSummarySheetOpen, setContactSummarySheetOpen } =
    useContactStore()
  const [summary, setSummary] = useState('')

  const { data, isPending } = api.contacts.summarizeContactMessages.useQuery({
    contactEmail: selectedContactEmail
  })

  useEffect(() => {
    if (data) {
      setSummary(data.summary)
    }
  }, [data])

  return (
    <Sheet
      open={contactSummarySheetOpen}
      onOpenChange={(open) => {
        setContactSummarySheetOpen(open)
        setSummary('')
      }}
    >
      {/* <SheetHeader></SheetHeader> */}
      <SheetContent className="">
        <SheetTitle className="text-white">Contact Summary</SheetTitle>
        <div className="mt-8"></div>
        {isPending || !data ? (
          <div>Summarizing...</div>
        ) : (
          <div className={`overflow-auto rounded-lg border-0 shadow-sm`}>
            <ScrollArea className="" type="always">
              <MarkdownPreview source={summary} className="p-4" />
            </ScrollArea>
          </div>
        )}
        {/* <div className="w-full break-words">{data?.summary ?? ''}</div> */}
      </SheetContent>
    </Sheet>
  )
}
