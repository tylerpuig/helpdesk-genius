import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '~/server/api/trpc'
import * as dbQueryUtils from '~/server/db/utils/queries'
import * as dbInsertionUtils from '~/server/db/utils/insertions'
import bcrypt from 'bcrypt'

export const chatRouter = createTRPCRouter({
  sendChatMessage: publicProcedure
    .input(z.object({ threadId: z.string(), workspaceId: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true }
    })
})
