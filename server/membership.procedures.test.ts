import type { TrpcContext } from "./_core/context";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getOrCreateUserProfile } from "./db";

function createContext(): TrpcContext {
  const now = new Date();
  return {
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: {
      id: 1,
      openId: "owner-open-id",
      name: "Owner",
      email: "owner@example.com",
      loginMethod: "google",
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
  };
}

describe("membership tier purchase procedures", () => {
  it("persists a tier upgrade and returns it in the caller purchase history", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.membership.createTierUpgrade({ toTier: "vip", duration: 14 });

    expect(result).toMatchObject({
      success: true,
      purchaseId: expect.any(Number),
      purchase: expect.objectContaining({
        userId: 1,
        tier: "vip",
        duration: 14,
        status: "completed",
        completedAt: expect.any(Date),
      }),
    });

    const updatedProfile = await getOrCreateUserProfile(1);
    expect(updatedProfile).toMatchObject({ membershipTier: "vip" });
    expect(updatedProfile?.tierUpgradedAt).toEqual(expect.any(Date));
    expect(updatedProfile?.tierExpiresAt).toEqual(expect.any(Date));

    const history = await caller.membership.getTierPurchaseHistory();
    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: result.purchaseId, userId: 1, tier: "vip", duration: 14 }),
      ]),
    );
  });
});
