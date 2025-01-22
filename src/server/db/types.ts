import { z } from 'zod'

export type MessageChannel = 'email' | 'chat' | 'call'
export type MessageRole = 'customer' | 'agent'
export type ThreadStatus = 'open' | 'closed' | 'archived' | 'junk' | 'trash'
export type ThreadPriority = 'low' | 'medium' | 'high'
export type TeamRole = 'owner' | 'admin' | 'member'
export type TeamInvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export const threadStatusSchema = z.enum(['open', 'closed', 'archived', 'junk', 'trash'])
