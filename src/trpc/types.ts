import { RouterOutputs } from './react'

export type ThreadData = NonNullable<RouterOutputs['messages']['viewEmailMessageThreads']>[0]
export type MessageData = NonNullable<RouterOutputs['messages']['getEmailMessagesFromThread']>[0]
