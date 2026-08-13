import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const activityMocks = vi.hoisted(() => ({
  likeActivityEvent: vi.fn(),
  rateActivityEvent: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db")>()),
  ...activityMocks,
}));

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  const now = new Date();
  return {
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: {
      id: 1,
      openId: "activity-write-error-owner",
      name: "Activity Test User",
      email: "activity-write-error@example.com",
      loginMethod: "google",
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
  };
}

describe("activity feed write errors", () => {
  it("rejects a like when its persistence helper throws", async () => {
    activityMocks.likeActivityEvent.mockRejectedValueOnce(new Error("activity like database write failed"));
    const caller = appRouter.createCaller(createContext());

    await expect(caller.activityFeed.like({ eventId: 1 })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "INTERNAL_SERVER_ERROR",
      message: "activity like database write failed",
    });
  });

  it("rejects a rating when its persistence helper throws", async () => {
    activityMocks.rateActivityEvent.mockRejectedValueOnce(new Error("activity rating database write failed"));
    const caller = appRouter.createCaller(createContext());

    await expect(caller.activityFeed.rate({ eventId: 1, rating: 5 })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "INTERNAL_SERVER_ERROR",
      message: "activity rating database write failed",
    });
  });
});
