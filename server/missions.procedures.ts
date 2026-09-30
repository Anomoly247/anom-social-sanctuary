import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { completeGlobalMission, getMissionStatus, listGlobalMissions } from "./missionLedger";

export const missionsRouter = router({
  list: publicProcedure.query(() => listGlobalMissions()),
  status: protectedProcedure.query(({ ctx }) => getMissionStatus(ctx.user.id)),
  complete: protectedProcedure
    .input(z.object({
      missionId: z.string().min(1).max(64),
      eventId: z.string().min(1).max(120),
      source: z.string().min(1).max(50),
      house: z.string().max(32).optional(),
      mount: z.string().max(64).optional(),
    }))
    .mutation(({ ctx, input }) => completeGlobalMission({ userId: ctx.user.id, ...input })),
});
