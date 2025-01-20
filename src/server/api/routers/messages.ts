import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { and, eq, desc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'

// TODO: Make routes protected
export const messagesRouter = createTRPCRouter({
  viewMessageThreads: publicProcedure.query(async ({ ctx, input }) => {
    const threads = await ctx.db
      .select({
        thread: {
          id: schema.threadsTable.id,
          status: schema.threadsTable.status,
          priority: schema.threadsTable.priority,
          title: schema.threadsTable.title,
          createdAt: schema.threadsTable.createdAt,
          lastMessageAt: schema.threadsTable.lastMessageAt
        },
        latestMessage: {
          content: schema.messagesTable.content,
          senderName: schema.messagesTable.senderName,
          senderEmail: schema.messagesTable.senderEmail,
          role: schema.messagesTable.role,
          createdAt: schema.messagesTable.createdAt,
          channel: schema.messagesTable.channel,
          isUnread: schema.messagesTable.isUnread
        }
      })
      .from(schema.threadsTable)
      .innerJoin(
        schema.messagesTable,
        and(
          eq(schema.messagesTable.threadId, schema.threadsTable.id),
          eq(schema.messagesTable.createdAt, schema.threadsTable.lastMessageAt)
        )
      )
      .where(eq(schema.threadsTable.status, 'open'))
      .orderBy(desc(schema.threadsTable.lastMessageAt))

    return threads
  }),
  getMessagesFromThread: publicProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db
        .select({
          id: schema.messagesTable.id,
          content: schema.messagesTable.content,
          senderName: schema.messagesTable.senderName,
          senderEmail: schema.messagesTable.senderEmail,
          role: schema.messagesTable.role,
          createdAt: schema.messagesTable.createdAt,
          channel: schema.messagesTable.channel,
          isUnread: schema.messagesTable.isUnread
        })
        .from(schema.messagesTable)
        .where(eq(schema.messagesTable.threadId, input.threadId))
        .orderBy(desc(schema.messagesTable.createdAt))

      return messages
    })
})
