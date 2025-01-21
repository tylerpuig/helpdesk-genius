'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { useForwardMessageDialog } from '~/app/_components/mail/utilities/forward-email-message/useForwardMessage'

export function EmailForwardDialog() {
  const { isOpen, close: closeDialog } = useForwardMessageDialog()
  const [recipients, setRecipients] = useState<string[]>([])
  const [newRecipient, setNewRecipient] = useState('')

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient])
      setNewRecipient('')
    }
  }

  const removeRecipient = (recipient: string) => {
    setRecipients(recipients.filter((r) => r !== recipient))
  }

  const handleSend = () => {
    closeDialog()
    setRecipients([])
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog()
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Forward Email</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add recipient email"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
            />
            <Button onClick={addRecipient}>Add</Button>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {recipients.map((recipient, index) => (
              <div
                key={index}
                className="mb-2 flex items-center justify-between rounded-md bg-secondary p-2"
              >
                <span>{recipient}</span>
                <Button variant="ghost" size="icon" onClick={() => removeRecipient(recipient)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => closeDialog()}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={recipients.length === 0}>
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
