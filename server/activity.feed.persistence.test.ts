import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function createContext(): TrpcContext {
  const now = new Date();
  return {
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: {
      id: 1,
      openId: "activity-persistence-owner",
      name: "Activity Test User",
      email: "activity-test@example.com",
      loginMethod: "google",
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
  };
}

describe("activity feed write persistence", () => {
  const nonexistentEventId = 2_147_483_647;

  it("rejects a like instead of returning success when no activity event row is updated", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.activityFeed.like({ eventId: nonexistentEventId })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "INTERNAL_SERVER_ERROR",
      message: "Activity event not found while liking",
    });
  });

  it("rejects a rating instead of returning success when no activity event row is updated", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.activityFeed.rate({ eventId: nonexistentEventId, rating: 5 })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "INTERNAL_SERVER_ERROR",
      message: "Activity event not found while rating",
    });
  });
});
