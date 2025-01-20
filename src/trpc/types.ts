import { RouterOutputs } from './react'

export type ThreadData = NonNullable<RouterOutputs['messages']['viewMessageThreads']>[0]
export type MessageData = NonNullable<RouterOutputs['messages']['getMessagesFromThread']>[0]
