import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '~/server/api/trpc'
import * as dbQueryUtils from '~/server/db/utils/queries'
import * as dbInsertionUtils from '~/server/db/utils/insertions'
import bcrypt from 'bcrypt'

export const authRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(z.object({ email: z.string(), password: z.string(), name: z.string() }))
    .mutation(async ({ input }) => {
      await dbInsertionUtils.createNewUser(input.email, input.name, input.password)

      return { success: true }
    }),
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const user = await dbQueryUtils.getUserByEmail(input.email)

      if (!user || !user.password) {
        throw new Error('User not found')
      }

      const isPasswordValid = await bcrypt.compare(input.password, user.password)

      if (!isPasswordValid) {
        throw new Error('Invalid password')
      }

      return { success: true }
    })
})
