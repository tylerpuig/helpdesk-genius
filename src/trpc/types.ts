import { RouterOutputs } from './react'

export type ThreadData = NonNullable<RouterOutputs['messages']['viewEmailMessageThreads']>[0]
export type MessageData = NonNullable<RouterOutputs['messages']['getEmailMessagesFromThread']>[0]

export type WorkspaceItem = NonNullable<RouterOutputs['workspace']['getUserWorkspaces']>[0]
export type ContactData = NonNullable<RouterOutputs['contacts']['getWorkspaceContacts']>[0]
