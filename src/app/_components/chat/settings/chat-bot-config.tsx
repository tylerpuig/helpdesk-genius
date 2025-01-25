'use client'

import { useState } from 'react'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Button } from '~/components/ui/button'
import { useToast } from '~/hooks/use-toast'

export function ChatbotConfig() {
  const [botName, setBotName] = useState('Helpdesk Assistant')
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I assist you today?')
  const [themeColor, setThemeColor] = useState('#007bff')
  const [enableVoice, setEnableVoice] = useState(false)
  const [enableAttachments, setEnableAttachments] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    console.log({ botName, welcomeMessage, themeColor, enableVoice, enableAttachments })
    toast({
      title: 'Configuration updated',
      description: 'Your chatbot configuration has been saved.'
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="botName">Bot Name</Label>
          <Input
            id="botName"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Helpdesk Assistant"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Textarea
            id="welcomeMessage"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Hello! How can I assist you today?"
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="themeColor">Theme Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="themeColor"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              placeholder="#007bff"
            />
            <div
              className="h-10 w-10 rounded-full border"
              style={{ backgroundColor: themeColor }}
            ></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="enableVoice" checked={enableVoice} onCheckedChange={setEnableVoice} />
          <Label htmlFor="enableVoice">Enable Voice</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="enableAttachments"
            checked={enableAttachments}
            onCheckedChange={setEnableAttachments}
          />
          <Label htmlFor="enableAttachments">Enable Attachments</Label>
        </div>
      </div>
      <div className="md:col-span-2">
        <Button onClick={handleSave}>Save Configuration</Button>
      </div>
    </div>
  )
}
