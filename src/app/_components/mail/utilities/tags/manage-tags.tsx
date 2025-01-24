'use client'

import React, { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
import { useTagStore } from './useTagStore'
import { useThreadStore } from '~/hooks/store/useThread'

export default function ManageTagsSheet() {
  const { selectedWorkspaceId } = useWorkspace()
  const { tagManagerSheetOpen, setTagManagerSheetOpen } = useTagStore()
  const { threadStatus, threadPriority, threadReadStatus } = useThreadStore()

  const [inputValue, setInputValue] = useState('')
  const [colorValue, setColorValue] = useState('#000000')

  const { data: tags, refetch: refetchTags } = api.messages.getWorkspaceTags.useQuery({
    workspaceId: selectedWorkspaceId
  })

  const { refetch: refetchThreads } = api.messages.viewEmailMessageThreads.useQuery(
    {
      workspaceId: selectedWorkspaceId,
      status: threadStatus,
      threadPriority,
      readStatus: threadReadStatus
    },
    {
      enabled: false
    }
  )

  const createTag = api.messages.createNewTag.useMutation({
    onSuccess: () => {
      refetchTags()
      refetchThreads()
    }
  })

  const deleteTag = api.messages.deleteTag.useMutation({
    onSuccess: () => {
      refetchTags()
      refetchThreads()
    }
  })

  return (
    <Sheet open={tagManagerSheetOpen} onOpenChange={setTagManagerSheetOpen}>
      <SheetHeader></SheetHeader>
      <SheetContent>
        <SheetTitle className="text-white">Tag Manager</SheetTitle>
        <div className="w-full">
          <div>
            <div className="mb-4 flex flex-col space-y-4 pt-8">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter a tag"
                  className="flex-grow"
                />
                <Button
                  onClick={() => {
                    createTag.mutate({
                      workspaceId: selectedWorkspaceId,
                      name: inputValue,
                      color: colorValue
                    })
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="tag-color" className="text-sm">
                  Tag Color:
                </Label>
                <Input
                  id="tag-color"
                  type="color"
                  value={colorValue}
                  onChange={(e) => setColorValue(e.target.value)}
                  className="h-8 w-12 border-none p-0"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags &&
                tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center rounded-full px-2 py-1 text-sm"
                    style={{ backgroundColor: tag.color, color: getContrastColor(tag.color) }}
                  >
                    {tag.name}
                    <button
                      onClick={() => {
                        deleteTag.mutate({
                          id: tag.id
                        })
                      }}
                      className="ml-2 focus:outline-none"
                      aria-label={`Remove ${tag.name} tag`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black or white depending on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
