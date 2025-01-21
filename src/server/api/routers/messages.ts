import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { and, eq, desc, asc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as dbInsertionUtils from '~/server/db/utils/insertions'

export const messagesRouter = createTRPCRouter({
  viewEmailMessageThreads: protectedProcedure.query(async ({ ctx, input }) => {
    const threads = await ctx.db
      .select({
        thread: {
          id: schema.threadsTable.id,
          status: schema.threadsTable.status,
          priority: schema.threadsTable.priority,
          title: schema.threadsTable.title,
          createdAt: schema.threadsTable.createdAt,
          lastMessageAt: schema.threadsTable.lastMessageAt,
          channel: schema.threadsTable.channel,
          isUnread: schema.threadsTable.isUnread
        },
        latestMessage: {
          content: schema.messagesTable.content,
          senderName: schema.messagesTable.senderName,
          senderEmail: schema.messagesTable.senderEmail,
          role: schema.messagesTable.role,
          createdAt: schema.messagesTable.createdAt,
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
  getEmailMessagesFromThread: protectedProcedure
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
          isUnread: schema.messagesTable.isUnread
        })
        .from(schema.messagesTable)
        .where(eq(schema.messagesTable.threadId, input.threadId))
        .orderBy(asc(schema.messagesTable.createdAt))

      return messages
    }),
  createEmailMessageReply: protectedProcedure
    .input(z.object({ threadId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await dbInsertionUtils.createNewEmailMessageReply(input.threadId, input.content, ctx)

      return { success: true }
    }),
  markThreadAsRead: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ input }) => {
      await dbInsertionUtils.updateIsThreadRead(input.threadId, false)

      return { success: true }
    }),
  markThreadAsUnread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ input }) => {
      await dbInsertionUtils.updateIsThreadRead(input.threadId, true)

      return { success: true }
    })
})
