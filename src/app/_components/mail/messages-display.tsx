'use client'
import { format } from 'date-fns/format'
import { CircleCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { EmailThread } from '~/app/_components/mail/thread/email-thread'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Switch } from '~/components/ui/switch'
import { useThreadStore } from '~/hooks/store/useThread'
import { api } from '~/trpc/react'
import { type MessageData } from '~/trpc/types'
import { useSession } from 'next-auth/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'
// import { type Content } from '@tiptap/react'
import { MinimalTiptapEditor } from '~/app/_components/minimal-tiptap'
import MessageUtilities from './message-utilities'
import parse from 'html-react-parser'
import { useEmailMessageStore } from '~/app/_components/mail/useEmailMessageStore'

export function EmailMessagesDisplay() {
  const { selectedThreadId } = useThreadStore()
  const { selectedWorkspaceId } = useWorkspace()
  // const [replyContent, setReplyContent] = useState<Content>('')
  const { emailMessageContent, setEmailMessageContent } = useEmailMessageStore()

  const { data: messages, refetch: refetchMessages } =
    api.messages.getEmailMessagesFromThread.useQuery(
      { threadId: selectedThreadId ?? '' },
      {
        enabled: selectedThreadId !== null
      }
    )

  const lastMessage = messages ? messages.at(-1) : null
  const lastMessageIsCustomer = lastMessage?.role === 'customer'

  const sendMessage = api.messages.createEmailMessageReply.useMutation({
    onSuccess: () => {
      refetchMessages()
      setEmailMessageContent('')
    }
  })

  function handleSendEmailReply(): void {
    if (emailMessageContent && selectedThreadId) {
      sendMessage.mutate({
        threadId: selectedThreadId,
        content: emailMessageContent as string,
        workspaceId: selectedWorkspaceId
      })
    }
  }

  return (
    <div className="flex h-full flex-col">
      <MessageUtilities />
      <Separator />
      {selectedThreadId && lastMessage ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {' '}
          {/* Added overflow-hidden */}
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt={lastMessage.senderName ?? ''} />
                <AvatarFallback>
                  {(lastMessage.senderName ?? '')
                    .split(' ')
                    .map((chunk) => chunk[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{lastMessage?.senderName}</div>
                <div className="line-clamp-1 text-xs">{lastMessage?.senderEmail}</div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Reply-To:</span> {lastMessage?.senderEmail}
                </div>
              </div>
            </div>
            {lastMessage?.createdAt && (
              <div className="ml-auto text-xs text-muted-foreground">
                {format(lastMessage?.createdAt, 'PPpp')}
              </div>
            )}
          </div>
          <Separator />
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {messages?.length && messages?.length > 1 && (
              <EmailThread messages={lastMessageIsCustomer ? messages.slice(0, -1) : messages} />
            )}

            {!lastMessageIsCustomer && <UserHasRepliedAlert latestMessage={lastMessage} />}
            {lastMessageIsCustomer && (
              <div className="whitespace-pre-wrap p-4 text-sm">{parse(lastMessage?.content)}</div>
            )}
          </div>
          <div className="flex-shrink-0">
            {' '}
            {/* Fixed bottom section */}
            <Separator className="w-full" />
            <div className="p-4">
              <div className="grid gap-4">
                <MinimalTiptapEditor
                  value={emailMessageContent}
                  onChange={(e) => {
                    setEmailMessageContent(e as string)
                  }}
                  className="w-full"
                  editorContentClassName="p-5"
                  output="html"
                  placeholder={`${lastMessageIsCustomer ? `Reply to ${lastMessage?.senderName}` : 'Follow up'}...`}
                  autofocus={true}
                  editable={true}
                  editorClassName="focus:outline-none"
                />
                <div className="flex items-center">
                  <Label htmlFor="mute" className="flex items-center gap-2 text-xs font-normal">
                    <Switch id="mute" aria-label="Mute thread" /> Mute this thread
                  </Label>
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      handleSendEmailReply()
                    }}
                    size="sm"
                    className="ml-auto px-4"
                  >
                    {sendMessage.isPending ? (
                      <span className="loading loading-dots loading-md"></span>
                    ) : (
                      'Reply'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">No message selected</div>
      )}
    </div>
  )
}

function UserHasRepliedAlert({ latestMessage }: { latestMessage: MessageData }) {
  const { data: session } = useSession()
  const isSameUser = latestMessage?.senderEmail === session?.user?.email
  const userName = isSameUser ? 'You' : latestMessage?.senderName
  return (
    <div className="px-4">
      <Alert>
        <CircleCheck className="h-4 w-4 stroke-green-500" />
        <AlertTitle>Ticket resolved</AlertTitle>
        <AlertDescription>
          {userName} replied to this email at {latestMessage?.createdAt?.toLocaleString()}
        </AlertDescription>
      </Alert>
    </div>
  )
}
