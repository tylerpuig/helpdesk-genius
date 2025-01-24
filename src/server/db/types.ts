import { z } from 'zod'
import { InferSelectModel } from 'drizzle-orm'
import * as schema from './schema'

export type MessageChannel = 'email' | 'chat' | 'call'
export type MessageRole = 'customer' | 'agent'
export type ThreadStatus = 'open' | 'closed' | 'archived' | 'junk' | 'trash'
export type ThreadPriority = 'low' | 'medium' | 'high'
export type WorkspaceRole = 'owner' | 'admin' | 'member'
export type WorkspaceInvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type WorkspaceTag = InferSelectModel<typeof schema.tagsTable>

export const threadStatusSchema = z.enum(['open', 'closed', 'archived', 'junk', 'trash'])
