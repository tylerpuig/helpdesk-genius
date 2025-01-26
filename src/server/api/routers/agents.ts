import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import * as schema from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
import * as openaiUtils from '~/server/integrations/openai'

export const agentsRouter = createTRPCRouter({
  getWorkspaceAgents: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string()
      })
    )
    .query(async ({ input, ctx }) => {
      const agents = await ctx.db.query.agentsTable.findMany({
        where: eq(schema.agentsTable.workspaceId, input.workspaceId),
        limit: 10
      })

      return agents
    }),
  createWorkspaceAgent: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        title: z.string(),
        description: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [agent] = await ctx.db
        .insert(schema.agentsTable)
        .values({
          workspaceId: input.workspaceId,
          title: input.title,
          description: input.description
        })
        .returning()

      return agent
    }),
  addKnowledgeToAgent: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        knowledgeContent: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const embedding = await openaiUtils.generateEmbeddingFromText(input.knowledgeContent)
      if (!embedding) {
        return { success: false }
      }

      await ctx.db.insert(schema.knowledgeBaseEmbeddingsTable).values({
        agentId: input.agentId,
        rawContent: input.knowledgeContent,
        embedding: embedding
      })

      return { success: true }
    }),
  updateAgentKnowledge: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        knowledgeIndex: z.number(),
        knowledgeContent: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const embedding = await openaiUtils.generateEmbeddingFromText(input.knowledgeContent)
      if (!embedding) {
        return { success: false }
      }

      await ctx.db
        .update(schema.knowledgeBaseEmbeddingsTable)
        .set({
          rawContent: input.knowledgeContent,
          embedding: embedding
        })
        .where(eq(schema.knowledgeBaseEmbeddingsTable.agentId, input.agentId))

      return { success: true }
    }),
  deleteAgent: protectedProcedure
    .input(z.object({ agentId: z.string(), workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.agentsTable)
        .where(
          and(
            eq(schema.agentsTable.id, input.agentId),
            eq(schema.agentsTable.workspaceId, input.workspaceId)
          )
        )

      return { success: true }
    }),
  getAgentDetails: protectedProcedure
    .input(z.object({ agentId: z.string(), workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = await ctx.db.query.agentsTable.findFirst({
        where: and(
          eq(schema.agentsTable.id, input.agentId),
          eq(schema.agentsTable.workspaceId, input.workspaceId)
        ),
        columns: {
          id: true,
          title: true,
          description: true,
          createdAt: true
        }
      })

      return agent
    }),
  updateAgentDetails: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        workspaceId: z.string(),
        title: z.string(),
        description: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(schema.agentsTable)
        .set({
          title: input.title,
          description: input.description
        })
        .where(
          and(
            eq(schema.agentsTable.id, input.agentId),
            eq(schema.agentsTable.workspaceId, input.workspaceId)
          )
        )

      return { success: true }
    })
})
