import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { and, eq, desc, asc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as dbQueryUtils from '~/server/db/utils/queries'
import { TRPCError } from '@trpc/server'
import { faker } from '@faker-js/faker'

export const teamsRouter = createTRPCRouter({
  createTeam: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const teamSlug = faker.company.name()
        console.log(ctx.session.user.id)

        const [team] = await tx
          .insert(schema.teamsTable)
          .values({
            name: input.name,
            slug: teamSlug
          })
          .returning()

        if (!team) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create team'
          })
        }

        await tx.insert(schema.teamMembersTable).values({
          teamId: team.id,
          userId: ctx.session.user.id,
          role: 'owner'
        })
      })

      return { success: true }
    }),
  getUserTeams: protectedProcedure.query(async ({ ctx }) => {
    const teams = await ctx.db
      .select({
        id: schema.teamsTable.id,
        name: schema.teamsTable.name,
        createdAt: schema.teamsTable.createdAt,
        role: schema.teamMembersTable.role
      })
      .from(schema.teamMembersTable)
      .leftJoin(schema.teamsTable, eq(schema.teamsTable.id, schema.teamMembersTable.teamId))
      .where(eq(schema.teamMembersTable.userId, ctx.session.user.id))

    return teams
  }),
  inviteUser: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        email: z.string(),
        role: z.enum(['member', 'admin', 'owner'])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [team] = await ctx.db
        .select({
          id: schema.teamsTable.id,
          name: schema.teamsTable.name,
          slug: schema.teamsTable.slug
        })
        .from(schema.teamsTable)
        .where(eq(schema.teamsTable.id, input.teamId))

      if (!team) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to invite user'
        })
      }

      await ctx.db.insert(schema.teamInvitationsTable).values({
        teamId: input.teamId,
        email: input.email,
        role: input.role,
        status: 'pending',
        invitedBy: ctx.session.user.id,
        expiresAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7) // 7 days
      })

      return { success: true }
    }),
  getTeamMembers: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const teamMembers = await ctx.db
        .select({
          team: {
            id: schema.teamMembersTable.id,
            role: schema.teamMembersTable.role,
            joinedAt: schema.teamMembersTable.joinedAt
          },
          user: {
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
            image: schema.users.image
          },
          invitation: {
            status: schema.teamInvitationsTable.status,
            expiresAt: schema.teamInvitationsTable.expiresAt
          }
        })
        .from(schema.teamMembersTable)
        .leftJoin(schema.users, eq(schema.users.id, schema.teamMembersTable.userId))
        .leftJoin(
          schema.teamInvitationsTable,
          and(
            eq(schema.teamInvitationsTable.teamId, schema.teamMembersTable.teamId),
            eq(schema.teamInvitationsTable.email, schema.users.email)
          )
        )
        .where(eq(schema.teamMembersTable.teamId, input.teamId))

      return teamMembers
    }),
  getTeamInvitations: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const teamInvitations = await ctx.db
        .select({
          id: schema.teamInvitationsTable.id,
          email: schema.teamInvitationsTable.email,
          role: schema.teamInvitationsTable.role,
          status: schema.teamInvitationsTable.status,
          createdAt: schema.teamInvitationsTable.createdAt,
          expiresAt: schema.teamInvitationsTable.expiresAt
        })
        .from(schema.teamInvitationsTable)
        .where(
          and(
            eq(schema.teamInvitationsTable.teamId, input.teamId),
            eq(schema.teamInvitationsTable.status, 'pending')
          )
        )

      return teamInvitations
    }),
  deleteTeamInvitation: protectedProcedure
    .input(z.object({ teamId: z.string(), invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const teamMember = await ctx.db.query.teamMembersTable.findFirst({
        where: and(
          eq(schema.teamMembersTable.teamId, input.teamId),
          eq(schema.teamMembersTable.userId, ctx.session.user.id)
        ),
        columns: {
          role: true
        }
      })

      if (teamMember?.role === 'member') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to delete this invitation'
        })
      }

      await ctx.db
        .delete(schema.teamInvitationsTable)
        .where(eq(schema.teamInvitationsTable.id, input.invitationId))
    }),
  deleteTeamMember: protectedProcedure
    .input(z.object({ teamId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [userInfo] = await ctx.db
        .select({
          id: schema.users.id,
          email: schema.users.email
        })
        .from(schema.users)
        .where(eq(schema.users.id, input.userId))

      if (!userInfo) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete team member'
        })
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(schema.teamMembersTable)
          .where(
            and(
              eq(schema.teamMembersTable.teamId, input.teamId),
              eq(schema.teamMembersTable.userId, input.userId)
            )
          )

        // delete team invitations
        await tx
          .delete(schema.teamInvitationsTable)
          .where(
            and(
              eq(schema.teamInvitationsTable.teamId, input.teamId),
              eq(schema.teamInvitationsTable.email, userInfo.email)
            )
          )
      })
      return { success: true }
    })
})
