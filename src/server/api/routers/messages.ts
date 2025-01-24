import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { and, eq, desc, asc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as dbInsertionUtils from '~/server/db/utils/insertions'
import { threadStatusSchema } from '~/server/db/types'

export const messagesRouter = createTRPCRouter({
  viewEmailMessageThreads: protectedProcedure
    .input(z.object({ status: threadStatusSchema, workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const threads = await ctx.db.query.threadsTable.findMany({
        where: and(
          eq(schema.threadsTable.status, input.status),
          eq(schema.threadsTable.workspaceId, input.workspaceId),
          eq(schema.threadsTable.channel, 'email')
        ),
        with: {
          messages: {
            orderBy: desc(schema.messagesTable.createdAt),
            limit: 1
          }
        },
        columns: {
          id: true,
          status: true,
          priority: true,
          title: true,
          createdAt: true,
          lastMessageAt: true,
          channel: true,
          isUnread: true
        },
        orderBy: desc(schema.threadsTable.lastMessageAt)
      })

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
    .input(z.object({ threadId: z.string(), workspaceId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await dbInsertionUtils.createNewEmailMessageReply(
        input.threadId,
        input.content,
        ctx,
        input.workspaceId
      )

      return { success: true }
    }),
  updateThreadReadStatus: protectedProcedure
    .input(z.object({ threadId: z.string(), isUnread: z.boolean() }))
    .mutation(async ({ input }) => {
      await dbInsertionUtils.updateIsThreadRead(input.threadId, input.isUnread)

      return { success: true }
    }),
  updateThreadStatus: protectedProcedure
    .input(z.object({ threadId: z.string(), status: threadStatusSchema, workspaceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(schema.threadsTable)
        .set({ status: input.status })
        .where(eq(schema.threadsTable.id, input.threadId))

      if (input.status === 'closed') {
        void dbInsertionUtils.incrementUserResolvedThread(ctx.session.user.id, input.workspaceId)
      }

      return { success: true }
    })
})
