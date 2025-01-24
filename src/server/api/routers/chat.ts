import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '~/server/api/trpc'
import * as schema from '~/server/db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import EventEmitter, { on } from 'events'
import * as dbQueryUtils from '~/server/db/utils/queries'

export const chatEE = new EventEmitter()
chatEE.setMaxListeners(100)
export const runtime = 'nodejs'

export type EventEmitterChatMessage = {
  notificationType: 'NEW_MESSAGE' | 'NEW_THREAD'
}

// export const chatEmitter = new EventEmitter()
export const chatRouter = createTRPCRouter({
  sendChatMessage: publicProcedure
    .input(z.object({ threadId: z.string(), workspaceId: z.string(), content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.transaction(async (tx) => {
        const thread = await tx.query.threadsTable.findFirst({
          where: eq(schema.threadsTable.id, input.threadId)
        })

        if (!thread) {
          throw new Error('Thread not found')
        }

        await tx.insert(schema.messagesTable).values({
          threadId: input.threadId,
          content: input.content,
          role: 'agent',
          senderEmail: ctx.session?.user?.email ?? '',
          senderName: ctx.session?.user?.name ?? ''
        })
      })
      return { success: true }
    }),
  getChatThreads: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const latestMessagesSubquery = ctx.db
        .select({
          threadId: schema.messagesTable.threadId,
          maxCreatedAt: sql`MAX(${schema.messagesTable.createdAt})`.as('maxCreatedAt')
        })
        .from(schema.messagesTable)
        .groupBy(schema.messagesTable.threadId)
        .as('latest_messages')

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
          latestMessagesSubquery,
          eq(latestMessagesSubquery.threadId, schema.threadsTable.id)
        )
        .innerJoin(
          schema.messagesTable,
          and(
            eq(schema.messagesTable.threadId, schema.threadsTable.id),
            eq(schema.messagesTable.createdAt, latestMessagesSubquery.maxCreatedAt)
          )
        )
        .where(
          and(
            eq(schema.threadsTable.workspaceId, input.workspaceId),
            eq(schema.threadsTable.channel, 'chat')
          )
        )
        .orderBy(desc(schema.threadsTable.lastMessageAt))
        .limit(20)

      return threads
    }),
  getChatMessagesFromThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ input, ctx }) => {
      const messages = await ctx.db.query.messagesTable.findMany({
        where: and(eq(schema.messagesTable.threadId, input.threadId)),
        orderBy: asc(schema.messagesTable.createdAt),
        limit: 50
      })

      let chatUserEmail = ''
      let chatUserName = ''
      if (messages.length > 0) {
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages?.[i]?.role === 'customer') {
            chatUserEmail = messages[i]?.senderEmail ?? ''
            chatUserName = messages[i]?.senderName ?? ''
            break
          }
        }
      }
      return {
        messages: messages,
        lastMessageTime: messages?.length > 0 ? messages.at(-1)?.createdAt : new Date(),
        chatUser: {
          name: chatUserName,
          email: chatUserEmail
        }
      }
    }),
  useChatSubscription: protectedProcedure.subscription(async function* ({ ctx, input, signal }) {
    try {
      for await (const [data] of on(chatEE, 'newMessage', { signal })) {
        const newMessage = data as EventEmitterChatMessage
        console.log('newMessage:', newMessage)

        yield newMessage
      }
    } catch (err) {
      console.error('Error in onMessage subscription:', err)
    }
  }),
  getRecentChatThreads: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const threads = await dbQueryUtils.getRecentChatThreads(input.workspaceId)
      return threads
    })
})
