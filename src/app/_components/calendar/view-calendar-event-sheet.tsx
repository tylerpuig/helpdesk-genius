import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, ClockIcon, MapPinIcon, Trash2Icon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { useCalendarStore } from '~/app/_components/calendar/useCalendarStore'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'

export default function ViewCalendarEventSheet() {
  const { selectedWorkspaceId } = useWorkspace()
  const {
    selectedCalendarEventId,
    setViewCalendarEventSheetOpen,
    viewCalendarEventSheetOpen,
    setSelectedCalendarEventId
  } = useCalendarStore()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const { refetch: refetchEvents } = api.calendar.getCalendarEvents.useQuery(
    {
      workspaceId: selectedWorkspaceId
    },
    {
      enabled: false
    }
  )

  const { data: event } = api.calendar.getSingleEvent.useQuery(
    {
      eventId: selectedCalendarEventId,
      workspaceId: selectedWorkspaceId
    },
    {
      enabled: viewCalendarEventSheetOpen
    }
  )

  const deleteEvent = api.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      refetchEvents()
      setViewCalendarEventSheetOpen(false)
      setSelectedCalendarEventId('')
    }
  })

  return (
    <Sheet open={viewCalendarEventSheetOpen} onOpenChange={setViewCalendarEventSheetOpen}>
      {event && (
        <SheetContent className="sm:max-w-[425px]">
          <SheetHeader>
            <SheetTitle>Event Details</SheetTitle>
            <SheetDescription>View and manage event details</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg">{event.title}</h2>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(event.start), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span>{event.start.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span>{'Location Here'}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium">Description</h3>
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Participants (2)</h3>
              <ul className="mt-2 space-y-2">
                {[
                  {
                    id: '1',
                    name: 'John Doe',
                    avatar: 'https://avatars.dicebear.com/api/initials/john-doe.svg'
                  },
                  {
                    id: '2',
                    name: 'Test User',
                    avatar: 'https://avatars.dicebear.com/api/initials/another-doe.svg'
                  }
                ].map((participant) => (
                  <li key={participant.id} className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              Delete Event
            </Button>
          </div>
        </SheetContent>
      )}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteEvent.mutate({
                  eventId: selectedCalendarEventId,
                  workspaceId: selectedWorkspaceId
                })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
