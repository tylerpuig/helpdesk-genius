'use client'

import { useState, useMemo } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useToast } from '~/hooks/use-toast'
import { Copy } from 'lucide-react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
export function ScriptTagCopy() {
  const { toast } = useToast()
  const { selectedWorkspaceId } = useWorkspace()
  const scriptTag = useMemo(
    () => `<script src="${appUrl}/api/chat/widget?workspaceId=${selectedWorkspaceId}"></script>`,
    [selectedWorkspaceId]
  )

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptTag)
      toast({
        title: 'Copied to clipboard',
        description: 'The script tag has been copied to your clipboard.',
        duration: 4_000
      })
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'There was an error copying the script tag.',
        variant: 'destructive',
        duration: 4_000
      })
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="script-tag">Chatbot Script Tag</Label>
      <div className="flex space-x-2">
        <Input id="script-tag" value={scriptTag} className="font-mono text-sm" />
        <Button onClick={copyToClipboard} size="icon">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Copy this script tag and paste it into your website's HTML to add the chatbot.
      </p>
    </div>
  )
}
