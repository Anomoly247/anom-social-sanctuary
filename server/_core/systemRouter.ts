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
