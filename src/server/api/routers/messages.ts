import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { and, eq, desc, asc, SQL } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as dbInsertionUtils from '~/server/db/utils/insertions'
import { threadStatusSchema } from '~/server/db/types'
import { type ThreadPriority } from '~/server/db/types'
import { generateEmailMessageReply } from '~/server/integrations/email'

export const messagesRouter = createTRPCRouter({
  viewEmailMessageThreads: protectedProcedure
    .input(
      z.object({
        status: threadStatusSchema,
        workspaceId: z.string(),
        threadPriority: z.union([z.string(), z.null()]),
        readStatus: z.enum(['unread', 'all'])
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL[] = [
        eq(schema.threadsTable.status, input.status),
        eq(schema.threadsTable.workspaceId, input.workspaceId),
        eq(schema.threadsTable.channel, 'email')
      ]

      if (input.threadPriority) {
        conditions.push(eq(schema.threadsTable.priority, input.threadPriority as ThreadPriority))
      }
      if (input.readStatus === 'unread') {
        conditions.push(eq(schema.threadsTable.isUnread, true))
      }
      const threads = await ctx.db.query.threadsTable.findMany({
        where: and(...conditions),
        with: {
          messages: {
            orderBy: desc(schema.messagesTable.createdAt),
            limit: 1
          },
          tags: {
            with: {
              tag: {
                columns: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
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
        orderBy: desc(schema.threadsTable.lastMessageAt),
        limit: 20
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
    }),
  createNewTag: protectedProcedure
    .input(z.object({ workspaceId: z.string(), name: z.string(), color: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(schema.tagsTable).values({
        workspaceId: input.workspaceId,
        name: input.name,
        color: input.color
      })

      return { success: true }
    }),
  deleteTag: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(schema.tagsTable).where(eq(schema.tagsTable.id, input.id))

      return { success: true }
    }),
  updateTagForThread: protectedProcedure
    .input(z.object({ threadId: z.string(), tagId: z.string(), action: z.enum(['add', 'remove']) }))
    .mutation(async ({ ctx, input }) => {
      if (input.action === 'remove') {
        await ctx.db
          .delete(schema.threadTagsTable)
          .where(
            and(
              eq(schema.threadTagsTable.threadId, input.threadId),
              eq(schema.threadTagsTable.tagId, input.tagId)
            )
          )
      } else {
        await ctx.db.insert(schema.threadTagsTable).values({
          threadId: input.threadId,
          tagId: input.tagId
        })
      }

      return { success: true }
    }),

  getWorkspaceTags: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const tags = await ctx.db.query.tagsTable.findMany({
        where: eq(schema.tagsTable.workspaceId, input.workspaceId)
      })

      return tags
    }),
  generateEmailMessageReply: protectedProcedure
    .input(z.object({ workspaceId: z.string(), threadId: z.string() }))
    .mutation(async ({ input }) => {
      const text = await generateEmailMessageReply(input.workspaceId, input.threadId)

      return { text }
    })
})
