import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import * as schema from '~/server/db/schema'
import { eq, asc } from 'drizzle-orm'
import { generateContactSummary } from '~/server/integrations/openai'

export const contactsRouter = createTRPCRouter({
  getWorkspaceContacts: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const contacts = await ctx.db.query.contactsTable.findMany({
        where: eq(schema.contactsTable.workspaceId, input.workspaceId)
      })

      return contacts
    }),
  deleteContact: protectedProcedure
    .input(z.object({ contactId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(schema.contactsTable).where(eq(schema.contactsTable.id, input.contactId))

      return { success: true }
    }),
  summarizeContactMessages: protectedProcedure
    .input(z.object({ contactEmail: z.string() }))
    .query(async ({ input, ctx }) => {
      const messages = await ctx.db
        .select({
          content: schema.messagesTable.content
        })
        .from(schema.messagesTable)
        .where(eq(schema.messagesTable.senderEmail, input.contactEmail))
        .orderBy(asc(schema.messagesTable.createdAt))
        .limit(15)

      const rawMessages = messages.map((message) => message.content).join('\n\n')
      const summary = await generateContactSummary(input.contactEmail, rawMessages)

      return {
        summary
      }
    })
})
