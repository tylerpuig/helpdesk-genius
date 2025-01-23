import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '~/server/api/trpc'
import * as dbQueryUtils from '~/server/db/utils/queries'
import * as dbInsertionUtils from '~/server/db/utils/insertions'
import * as schema from '~/server/db/schema'
import { eq, and, desc, asc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import EventEmitter, { on } from 'events'
import { observable } from '@trpc/server/observable'

export const chatEE = new EventEmitter()
chatEE.setMaxListeners(100)

// export const chatEmitter = new EventEmitter()
export const chatRouter = createTRPCRouter({
  sendChatMessage: publicProcedure
    .input(z.object({ threadId: z.string(), workspaceId: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true }
    }),
  getChatThreads: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const chats = await ctx.db.query.threadsTable.findMany({
        where: and(
          eq(schema.threadsTable.workspaceId, input.workspaceId),
          eq(schema.threadsTable.channel, 'chat')
        ),
        orderBy: desc(schema.threadsTable.createdAt),
        limit: 50
      })
      return chats
    }),
  getChatMessagesFromThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ input, ctx }) => {
      const messages = await ctx.db.query.messagesTable.findMany({
        where: and(eq(schema.messagesTable.threadId, input.threadId)),
        orderBy: asc(schema.messagesTable.createdAt),
        limit: 50
      })
      return messages
    }),
  useChatSubscription: protectedProcedure.subscription(async function* ({ ctx, input, signal }) {
    // const userId = ctx?.session?.user?.id
    // console.log('useChatSubscription')

    // if (!userId) {
    //   throw new TRPCError({
    //     code: 'UNAUTHORIZED',
    //     message: 'You must be logged in to subscribe to a channel.'
    //   })
    // }

    try {
      for await (const [data] of on(chatEE, 'newMessage', { signal })) {
        const newMessage = data
        console.log('newMessage:', newMessage)

        yield newMessage
      }
    } catch (err) {
      console.error('Error in onMessage subscription:', err)
    }
  })
})
