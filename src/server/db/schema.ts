import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  primaryKey,
  text,
  timestamp,
  varchar,
  pgTable,
  boolean
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

export const contacts = pgTable(
  'contact',
  {
    id: varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    // Optional fields that might be useful
    company: varchar('company', { length: 255 }),
    lastContactedAt: timestamp('last_contacted_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (contact) => [index('contact_email_idx').on(contact.email)]
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
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date()),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (thread) => [
    index('thread_status_idx').on(thread.status),
    index('thread_last_message_idx').on(thread.lastMessageAt)
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
    channel: varchar('channel', { length: 50 }).notNull().$type<DBTypes.MessageChannel>(), // 'email', 'chat', etc.
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

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts)
}))

export const threadsRelations = relations(threadsTable, ({ many, one }) => ({
  messages: many(messagesTable),
  assignments: many(threadAssignmentsTable)
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

export const contactsRelations = relations(contacts, ({ many }) => ({
  messages: many(messagesTable)
}))
