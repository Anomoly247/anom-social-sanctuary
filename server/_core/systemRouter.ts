import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  getStats: adminProcedure.query(async () => {
    const { getSystemStats } = await import("../db");
    return getSystemStats();
  }),

  getAllUsers: adminProcedure.query(async () => {
    const { getAllUsers } = await import("../db");
    return getAllUsers();
  }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot remove your own admin access." });
      }
      const { getUserById, updateUserRole, createAuditLog } = await import("../db");
      const targetUser = await getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }
      const res = await updateUserRole(input.userId, input.role);
      await createAuditLog({
        userId: ctx.user.id,
        action: `update_user_role_${input.role}`,
        entityType: "user",
        entityId: input.userId,
        details: { targetEmail: targetUser.email, previousRole: targetUser.role, newRole: input.role },
      });
      return res;
    }),

  updateUserStatus: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), status: z.enum(["active", "suspended"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id && input.status === "suspended") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot suspend your own account." });
      }
      const { getUserById, updateUserStatus, createAuditLog } = await import("../db");
      const targetUser = await getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }
      const res = await updateUserStatus(input.userId, input.status);
      await createAuditLog({
        userId: ctx.user.id,
        action: `update_user_status_${input.status}`,
        entityType: "user",
        entityId: input.userId,
        details: { targetEmail: targetUser.email, previousStatus: targetUser.status, newStatus: input.status },
      });
      return res;
    }),

  bulkUpdateUserRole: adminProcedure
    .input(z.object({ userIds: z.array(z.number().int().positive()).min(1), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userIds.includes(ctx.user.id) && input.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot remove your own admin access in a bulk action." });
      }
      const { getUserById, updateUserRole, createAuditLog } = await import("../db");
      for (const id of input.userIds) {
        if (!await getUserById(id)) {
          throw new TRPCError({ code: "NOT_FOUND", message: `User ID ${id} not found.` });
        }
      }
      for (const id of input.userIds) {
        await updateUserRole(id, input.role);
      }
      await createAuditLog({
        userId: ctx.user.id,
        action: `bulk_update_user_role_${input.role}`,
        entityType: "user",
        details: { count: input.userIds.length, userIds: input.userIds, newRole: input.role },
      });
      return { success: true, count: input.userIds.length } as const;
    }),

  bulkUpdateUserStatus: adminProcedure
    .input(z.object({ userIds: z.array(z.number().int().positive()).min(1), status: z.enum(["active", "suspended"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userIds.includes(ctx.user.id) && input.status === "suspended") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot suspend your own account in a bulk action." });
      }
      const { getUserById, updateUserStatus, createAuditLog } = await import("../db");
      for (const id of input.userIds) {
        if (!await getUserById(id)) {
          throw new TRPCError({ code: "NOT_FOUND", message: `User ID ${id} not found.` });
        }
      }
      for (const id of input.userIds) {
        await updateUserStatus(id, input.status);
      }
      await createAuditLog({
        userId: ctx.user.id,
        action: `bulk_update_user_status_${input.status}`,
        entityType: "user",
        details: { count: input.userIds.length, userIds: input.userIds, newStatus: input.status },
      });
      return { success: true, count: input.userIds.length } as const;
    }),

  getAuditLogs: adminProcedure.query(async () => {
    const { getAuditLogs } = await import("../db");
    return getAuditLogs(100);
  }),

  getEvents: adminProcedure.query(async () => {
    const { getCommunityEvents } = await import("../db");
    return getCommunityEvents();
  }),

  updateSettings: adminProcedure
    .input(
      z.object({
        siteName: z.string().optional(),
        siteDescription: z.string().optional(),
        maxCoinsPerDay: z.number().optional(),
        levelUpXP: z.number().optional(),
        achievementMultiplier: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { updatePlatformSettings } = await import("../db");
      const { maxCoinsPerDay: _maxCoinsPerDay, achievementMultiplier: _achievementMultiplier, levelUpXP, ...settings } = input;
      return updatePlatformSettings({ ...settings, ...(levelUpXP === undefined ? {} : { xpPerLevel: levelUpXP }) });
    }),

  createEvent: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        date: z.string().datetime(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { createCommunityEvent } = await import("../db");
      return createCommunityEvent({ ...input, userId: ctx.user.id, date: new Date(input.date) });
    }),

  deleteEvent: adminProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { deleteCommunityEvent } = await import("../db");
      const result = await deleteCommunityEvent(input.eventId);
      if (!result) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }
      return result;
    }),
});
