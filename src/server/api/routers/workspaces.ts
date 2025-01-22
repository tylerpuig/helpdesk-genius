import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { and, eq, desc, asc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as dbQueryUtils from '~/server/db/utils/queries'
import { TRPCError } from '@trpc/server'
import { faker } from '@faker-js/faker'

export const workspaceRouter = createTRPCRouter({
  createWorkspace: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const teamSlug = faker.company.name()

        const [workspace] = await tx
          .insert(schema.workspacesTable)
          .values({
            name: input.name,
            slug: teamSlug
          })
          .returning()

        if (!workspace) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create workspace'
          })
        }

        await tx.insert(schema.workspaceMembersTable).values({
          workspaceId: workspace.id,
          userId: ctx.session.user.id,
          role: 'owner'
        })
      })

      return { success: true }
    }),
  getUserWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const workspaces = await ctx.db
      .select({
        id: schema.workspacesTable.id,
        name: schema.workspacesTable.name,
        createdAt: schema.workspacesTable.createdAt,
        role: schema.workspaceMembersTable.role
      })
      .from(schema.workspaceMembersTable)
      .leftJoin(
        schema.workspacesTable,
        eq(schema.workspacesTable.id, schema.workspaceMembersTable.workspaceId)
      )
      .where(eq(schema.workspaceMembersTable.userId, ctx.session.user.id))

    return workspaces
  }),
  inviteUser: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string(),
        role: z.enum(['member', 'admin', 'owner'])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [workspace] = await ctx.db
        .select({
          id: schema.workspacesTable.id,
          name: schema.workspacesTable.name,
          slug: schema.workspacesTable.slug
        })
        .from(schema.workspacesTable)
        .where(eq(schema.workspacesTable.id, input.workspaceId))

      if (!workspace) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to invite user'
        })
      }

      await ctx.db.insert(schema.workspaceInvitationsTable).values({
        workspaceId: input.workspaceId,
        email: input.email,
        role: input.role,
        status: 'pending',
        invitedBy: ctx.session.user.id,
        expiresAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7) // 7 days
      })

      return { success: true }
    }),
  getTeamMembers: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isTeamMember = await dbQueryUtils.isUserWorkspaceMember(
        ctx.session.user.id,
        input.workspaceId
      )

      if (!isTeamMember.isMember) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this team'
        })
      }
      const workspaceMembers = await ctx.db
        .select({
          member: {
            id: schema.workspaceMembersTable.id,
            role: schema.workspaceMembersTable.role,
            joinedAt: schema.workspaceMembersTable.joinedAt
          },
          user: {
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
            image: schema.users.image
          },
          invitation: {
            status: schema.workspaceInvitationsTable.status,
            expiresAt: schema.workspaceInvitationsTable.expiresAt
          }
        })
        .from(schema.workspaceMembersTable)
        .leftJoin(schema.users, eq(schema.users.id, schema.workspaceMembersTable.userId))
        .leftJoin(
          schema.workspaceInvitationsTable,
          and(
            eq(
              schema.workspaceInvitationsTable.workspaceId,
              schema.workspaceMembersTable.workspaceId
            ),
            eq(schema.workspaceInvitationsTable.email, schema.users.email)
          )
        )
        .where(eq(schema.workspaceMembersTable.workspaceId, input.workspaceId))

      return workspaceMembers
    }),
  getTeamInvitations: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isTeamMember = await dbQueryUtils.isUserWorkspaceMember(
        ctx.session.user.id,
        input.workspaceId
      )

      if (!isTeamMember.isMember) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this team'
        })
      }

      const workspaceInvitations = await ctx.db
        .select({
          id: schema.workspaceInvitationsTable.id,
          email: schema.workspaceInvitationsTable.email,
          role: schema.workspaceInvitationsTable.role,
          status: schema.workspaceInvitationsTable.status,
          createdAt: schema.workspaceInvitationsTable.createdAt,
          expiresAt: schema.workspaceInvitationsTable.expiresAt
        })
        .from(schema.workspaceInvitationsTable)
        .where(
          and(
            eq(schema.workspaceInvitationsTable.workspaceId, input.workspaceId),
            eq(schema.workspaceInvitationsTable.status, 'pending')
          )
        )

      return workspaceInvitations
    }),
  deleteTeamInvitation: protectedProcedure
    .input(z.object({ workspaceId: z.string(), invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isTeamMember = await dbQueryUtils.isUserWorkspaceMember(
        ctx.session.user.id,
        input.workspaceId
      )

      if (!isTeamMember.isMember || isTeamMember.role === 'member') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this team'
        })
      }

      await ctx.db
        .delete(schema.workspaceInvitationsTable)
        .where(eq(schema.workspaceInvitationsTable.id, input.invitationId))
    }),
  deleteTeamMember: protectedProcedure
    .input(z.object({ workspaceId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isTeamMember = await dbQueryUtils.isUserWorkspaceMember(
        ctx.session.user.id,
        input.workspaceId
      )

      if (!isTeamMember.isMember || isTeamMember.role === 'member') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this team'
        })
      }
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
          .delete(schema.workspaceMembersTable)
          .where(
            and(
              eq(schema.workspaceMembersTable.workspaceId, input.workspaceId),
              eq(schema.workspaceMembersTable.userId, input.userId)
            )
          )

        // delete team invitations
        await tx
          .delete(schema.workspaceInvitationsTable)
          .where(
            and(
              eq(schema.workspaceInvitationsTable.workspaceId, input.workspaceId),
              eq(schema.workspaceInvitationsTable.email, userInfo.email)
            )
          )
      })
      return { success: true }
    })
})
