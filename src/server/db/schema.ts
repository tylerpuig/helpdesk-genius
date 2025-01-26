import { relations, sql } from 'drizzle-orm'
import {
  index,
  uniqueIndex,
  integer,
  primaryKey,
  text,
  timestamp,
  varchar,
  pgTable,
  boolean,
  vector
} from 'drizzle-orm/pg-core'
import { type AdapterAccount } from 'next-auth/adapters'
import * as DBTypes from '~/server/db/types'

export const users = pgTable('user', {
  id: varchar('id', { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }),
  emailVerified: timestamp('email_verified', {
    mode: 'date',
    withTimezone: true
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar('image', { length: 255 })
})

export const accounts = pgTable(
  'account',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar('type', { length: 255 }).$type<AdapterAccount['type']>().notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 255
    }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 })
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId]
    }),
    index('account_user_id_idx').on(account.userId)
  ]
)

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] })
}))

export const sessions = pgTable(
  'session',
  {
    sessionToken: varchar('session_token', { length: 255 }).notNull().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp('expires', {
      mode: 'date',
      withTimezone: true
    }).notNull()
  },
  (session) => [index('session_user_id_idx').on(session.userId)]
)

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] })
}))

export const verificationTokens = pgTable(
  'verification_token',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', {
      mode: 'date',
      withTimezone: true
    }).notNull()
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
)

export const contactsTable = pgTable(
  'contact',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: varchar('workspace_id', { length: 255 })
      .notNull()
      .references(() => workspacesTable.id),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    company: varchar('company', { length: 255 }),
    lastContactedAt: timestamp('last_contacted_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (contact) => [
    // Make email unique per workspace
    uniqueIndex('contact_workspace_email_idx').on(contact.workspaceId, contact.email),
    index('contact_workspace_idx').on(contact.workspaceId),
    index('contact_email_idx').on(contact.email)
  ]
)
export const workspacesTable = pgTable(
  'workspace',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date())
  },
  (workspace) => [uniqueIndex('workspace_slug_idx').on(workspace.slug)]
)

export const threadsTable = pgTable(
  'thread',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    status: varchar('status', { length: 50 })
      .notNull()
      .default('open')
      .$type<DBTypes.ThreadStatus>(),
    priority: varchar('priority', { length: 50 })
      .notNull()
      .default('low')
      .$type<DBTypes.ThreadPriority>(),
    title: varchar('title', { length: 256 }),
    workspaceId: varchar('workspace_id', { length: 255 })
      .notNull()
      .references(() => workspacesTable.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    channel: varchar('channel', { length: 50 }).notNull().$type<DBTypes.MessageChannel>(), // 'email', 'chat', etc.
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date()),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isUnread: boolean('is_unread').default(true),
    messageCount: integer('message_count').notNull().default(0),
    customerMessageCount: integer('customer_message_count').notNull().default(0),
    agentMessageCount: integer('agent_message_count').notNull().default(0),
    firstResponseTime: integer('first_response_time') // in seconds, null until first response
  },
  (thread) => [
    index('thread_workspace_idx').on(thread.workspaceId),
    index('thread_status_idx').on(thread.status),
    index('thread_last_message_idx').on(thread.lastMessageAt),
    index('thread_channel_idx').on(thread.channel)
  ]
)

export const threadAssignmentsTable = pgTable(
  'thread_assignment',
  {
    threadId: varchar('thread_id', { length: 255 })
      .notNull()
      .references(() => threadsTable.id),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (assignment) => [
    // Make the combination of threadId and userId unique
    primaryKey({ columns: [assignment.threadId, assignment.userId] }),
    index('thread_assignment_thread_idx').on(assignment.threadId),
    index('thread_assignment_user_idx').on(assignment.userId)
  ]
)

export const messagesTable = pgTable(
  'message',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    threadId: varchar('thread_id', { length: 255 })
      .notNull()
      .references(() => threadsTable.id),
    content: text('content').notNull(),
    senderEmail: varchar('sender_email', { length: 255 }).notNull(),
    senderName: varchar('sender_name', { length: 255 }),
    role: varchar('role', { length: 50 }).notNull().$type<DBTypes.MessageRole>(), // 'customer', 'agent'
    isUnread: boolean('is_unread').default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (message) => [
    index('message_thread_id_idx').on(message.threadId),
    index('message_created_at_idx').on(message.createdAt)
  ]
)

export const liveChatsTable = pgTable('live_chat', {
  id: varchar('id').notNull().primaryKey(),
  threadId: varchar('thread_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export const agentsTable = pgTable('agent', {
  id: varchar('id', { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: varchar('workspace_id', { length: 255 })
    .notNull()
    .references(() => workspacesTable.id),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export const knowledgeBaseEmbeddingsTable = pgTable(
  'knowledge_base_embeddings',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Store which agent this message was assigned to
    agentId: varchar('agent_id', { length: 255 })
      .notNull()
      .references(() => agentsTable.id),
    embedding: vector('embedding', { dimensions: 1536 }),
    rawContent: text('raw_content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (knowledeBaseEmbeddings) => [
    index('knowledge_base_embeddings_agent_idx').on(knowledeBaseEmbeddings.agentId),
    index('knowledge_base_embeddings_message_idx').using(
      'hnsw',
      knowledeBaseEmbeddings.embedding.op('vector_cosine_ops')
    )
  ]
)

// For daily metrics per user
export const userDailyMetricsTable = pgTable(
  'user_daily_metrics',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    workspaceId: varchar('workspace_id', { length: 255 }) // Add this
      .notNull()
      .references(() => workspacesTable.id),
    date: timestamp('date', { withTimezone: true })
      .notNull()
      .default(sql`date_trunc('day', CURRENT_TIMESTAMP)`),
    threadsAssigned: integer('threads_assigned').notNull().default(0),
    threadsResolved: integer('threads_resolved').notNull().default(0),
    totalResponseTime: integer('total_response_time').notNull().default(0),
    responseCount: integer('response_count').notNull().default(0),
    averageFirstResponseTime: integer('average_first_response_time').notNull().default(0),
    customerMessageCount: integer('customer_message_count').notNull().default(0),
    agentMessageCount: integer('agent_message_count').notNull().default(0)
  },
  (metric) => [
    // Modify unique index to include workspace
    uniqueIndex('user_daily_metrics_workspace_user_date_idx').using(
      'btree',
      metric.workspaceId.asc(),
      metric.userId.asc(),
      metric.date.asc()
    ),
    index('user_daily_metrics_workspace_idx').on(metric.workspaceId),
    index('user_daily_metrics_user_idx').on(metric.userId),
    index('user_daily_metrics_date_idx').on(metric.date)
  ]
)

// For overall user stats (lifetime metrics)
export const userStatsTable = pgTable(
  'user_stats',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    workspaceId: varchar('workspace_id', { length: 255 }) // Add this
      .notNull()
      .references(() => workspacesTable.id),
    totalThreadsHandled: integer('total_threads_handled').notNull().default(0),
    totalThreadsResolved: integer('total_threads_resolved').notNull().default(0),
    averageResponseTime: integer('average_response_time').notNull().default(0),
    averageFirstResponseTime: integer('average_first_response_time').notNull().default(0),
    totalCustomerMessages: integer('total_customer_messages').notNull().default(0),
    totalAgentMessages: integer('total_agent_messages').notNull().default(0),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (stats) => [
    // Make the combination of userId and workspaceId the primary key
    primaryKey({ columns: [stats.userId, stats.workspaceId] }),
    index('user_stats_workspace_idx').on(stats.workspaceId)
  ]
)

export const workspaceMembersTable = pgTable(
  'workspace_member',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: varchar('workspace_id', { length: 255 })
      .notNull()
      .references(() => workspacesTable.id),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    role: varchar('role', { length: 50 })
      .notNull()
      .default('member')
      .$type<DBTypes.WorkspaceRole>(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (member) => [
    uniqueIndex('workspace_member_workspace_user_idx').on(member.workspaceId, member.userId),
    index('workspace_member_workspace_idx').on(member.workspaceId),
    index('workspace_member_user_idx').on(member.userId)
  ]
)

// Workspace invitations
export const workspaceInvitationsTable = pgTable(
  'workspace_invitation',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: varchar('workspace_id', { length: 255 })
      .notNull()
      .references(() => workspacesTable.id),
    email: varchar('email', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 })
      .notNull()
      .default('member')
      .$type<DBTypes.WorkspaceRole>(),
    status: varchar('status', { length: 50 })
      .notNull()
      .default('pending')
      .$type<DBTypes.WorkspaceInvitationStatus>(),
    invitedBy: varchar('invited_by', { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptedBy: varchar('accepted_by', { length: 255 }).references(() => users.id)
  },
  (invitation) => [
    index('workspace_invitation_workspace_idx').on(invitation.workspaceId),
    index('workspace_invitation_email_idx').on(invitation.email),
    index('workspace_invitation_status_idx').on(invitation.status)
  ]
)

export const tagsTable = pgTable(
  'tag',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: varchar('workspace_id', { length: 255 })
      .notNull()
      .references(() => workspacesTable.id),
    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 7 }).notNull(), // Hex color code
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (tag) => [
    // Tag names unique per workspace
    uniqueIndex('tag_workspace_name_idx').on(tag.workspaceId, tag.name),
    index('tag_workspace_idx').on(tag.workspaceId)
  ]
)

// Junction table for thread tags
export const threadTagsTable = pgTable(
  'thread_tag',
  {
    threadId: varchar('thread_id', { length: 255 })
      .notNull()
      .references(() => threadsTable.id),
    tagId: varchar('tag_id', { length: 255 })
      .notNull()
      .references(() => tagsTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (threadTag) => [
    // Combination of threadId and tagId unique
    primaryKey({ columns: [threadTag.threadId, threadTag.tagId] }),
    index('thread_tag_thread_idx').on(threadTag.threadId),
    index('thread_tag_tag_idx').on(threadTag.tagId)
  ]
)

export const tagsRelations = relations(tagsTable, ({ one, many }) => ({
  workspace: one(workspacesTable, {
    fields: [tagsTable.workspaceId],
    references: [workspacesTable.id]
  }),
  threadTags: many(threadTagsTable)
}))

export const threadTagsRelations = relations(threadTagsTable, ({ one }) => ({
  thread: one(threadsTable, {
    fields: [threadTagsTable.threadId],
    references: [threadsTable.id]
  }),
  tag: one(tagsTable, {
    fields: [threadTagsTable.tagId],
    references: [tagsTable.id]
  })
}))

export const userDailyMetricsRelations = relations(userDailyMetricsTable, ({ one }) => ({
  user: one(users, { fields: [userDailyMetricsTable.userId], references: [users.id] }),
  workspace: one(workspacesTable, {
    fields: [userDailyMetricsTable.workspaceId],
    references: [workspacesTable.id]
  })
}))

export const userStatsRelations = relations(userStatsTable, ({ one }) => ({
  user: one(users, { fields: [userStatsTable.userId], references: [users.id] }),
  workspace: one(workspacesTable, {
    fields: [userStatsTable.workspaceId],
    references: [workspacesTable.id]
  })
}))
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  workspaceMemberships: many(workspaceMembersTable),
  workspaceInvitationsSent: many(workspaceInvitationsTable, { relationName: 'inviter' }),
  workspaceInvitationsAccepted: many(workspaceInvitationsTable, { relationName: 'acceptedByUser' })
}))

export const workspacesRelations = relations(workspacesTable, ({ many }) => ({
  threads: many(threadsTable),
  members: many(workspaceMembersTable),
  invitations: many(workspaceInvitationsTable),
  userDailyMetrics: many(userDailyMetricsTable),
  userStats: many(userStatsTable),
  contacts: many(contactsTable),
  tags: many(tagsTable)
}))

export const workspaceMembersRelations = relations(workspaceMembersTable, ({ one }) => ({
  workspace: one(workspacesTable, {
    fields: [workspaceMembersTable.workspaceId],
    references: [workspacesTable.id]
  }),
  user: one(users, { fields: [workspaceMembersTable.userId], references: [users.id] })
}))

export const threadsRelations = relations(threadsTable, ({ one, many }) => ({
  workspace: one(workspacesTable, {
    fields: [threadsTable.workspaceId],
    references: [workspacesTable.id]
  }),
  messages: many(messagesTable),
  assignments: many(threadAssignmentsTable),
  tags: many(threadTagsTable)
}))

export const workspaceInvitationsRelations = relations(workspaceInvitationsTable, ({ one }) => ({
  workspace: one(workspacesTable, {
    fields: [workspaceInvitationsTable.workspaceId],
    references: [workspacesTable.id]
  }),
  inviter: one(users, {
    fields: [workspaceInvitationsTable.invitedBy],
    references: [users.id]
  }),
  acceptedByUser: one(users, {
    fields: [workspaceInvitationsTable.acceptedBy],
    references: [users.id]
  })
}))

export const threadAssignmentsRelations = relations(threadAssignmentsTable, ({ one }) => ({
  thread: one(threadsTable, {
    fields: [threadAssignmentsTable.threadId],
    references: [threadsTable.id]
  }),
  user: one(users, { fields: [threadAssignmentsTable.userId], references: [users.id] })
}))

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  thread: one(threadsTable, { fields: [messagesTable.threadId], references: [threadsTable.id] })
}))

export const contactsRelations = relations(contactsTable, ({ one, many }) => ({
  workspace: one(workspacesTable, {
    fields: [contactsTable.workspaceId],
    references: [workspacesTable.id]
  }),
  messages: many(messagesTable)
}))
