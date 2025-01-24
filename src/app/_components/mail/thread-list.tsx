import { useEffect } from 'react'
import { ComponentProps } from 'react'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { cn } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import { api } from '~/trpc/react'
import { useThreadStore } from '~/hooks/store/useThread'
import { useWorkspace } from '~/hooks/context/useWorkspaces'

export function MailList() {
  const { selectedThreadId, updateSelectedThreadId, threadStatus, updateThreads } = useThreadStore()
  const { selectedWorkspaceId } = useWorkspace()

  const { data: threadsData, refetch: refetchThreads } =
    api.messages.viewEmailMessageThreads.useQuery({
      status: threadStatus,
      workspaceId: selectedWorkspaceId
    })

  useEffect(() => {
    if (threadsData?.length) {
      updateThreads(threadsData)
    }
  }, [threadsData, selectedThreadId])

  const markThreadAsRead = api.messages.updateThreadReadStatus.useMutation({
    onSuccess: () => {
      refetchThreads()
    }
  })

  // const latestMessage = threadsData?.messages?.at(-1)

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {(threadsData ?? []).map((item) => {
          const latestMessage = item.messages?.at(-1)
          return (
            <button
              key={item.id}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
                selectedThreadId === item.id && 'bg-muted'
              )}
              onClick={() => {
                updateSelectedThreadId(item.id)
                markThreadAsRead.mutate({ threadId: item.id, isUnread: false })
              }}
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">
                      {item?.title ?? ''}
                      {item?.isUnread && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'ml-auto text-xs',
                      selectedThreadId === item.id ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {formatDistanceToNow(new Date(item.lastMessageAt), {
                      addSuffix: true
                    })}
                  </div>
                </div>
                <div className="text-xs font-medium">{latestMessage?.content.substring(0, 25)}</div>
              </div>
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {latestMessage?.content.substring(0, 300)}
              </div>
              {true ? (
                <div className="flex items-center gap-2">
                  <Badge key={item.priority} variant={getBadgeVariantByPriority(item.priority)}>
                    {item.priority}
                  </Badge>
                  {['work', 'personal'].map((label) => (
                    <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                      {label}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function getBadgeVariantFromLabel(label: string): ComponentProps<typeof Badge>['variant'] {
  if (['work'].includes(label.toLowerCase())) {
    return 'default'
  }

  if (['personal'].includes(label.toLowerCase())) {
    return 'outline'
  }

  return 'secondary'
}

function getBadgeVariantByPriority(label: string): ComponentProps<typeof Badge>['variant'] {
  switch (label) {
    case 'high':
      return 'highPriority'
    case 'medium':
      return 'mediumPriority'
    case 'low':
      return 'lowPriority'
  }

  return 'secondary'
}
