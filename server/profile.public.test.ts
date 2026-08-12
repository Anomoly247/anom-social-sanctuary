import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { getAchievements, getDb, getUserByOpenId, unlockAchievement, upsertUser } from "./db";
import { achievements } from "../drizzle/schema";
import { appRouter } from "./routers";

function createContext(user: NonNullable<TrpcContext["user"]>): TrpcContext {
  return {
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user,
  };
}

describe("public profile data", () => {
  it("returns the profile owner name and real achievement count rather than viewer placeholders", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ownerOpenId = `public-owner-${suffix}`;
    const viewerOpenId = `public-viewer-${suffix}`;
    const ownerName = `Owner ${suffix}`;
    const achievementName = `Public profile achievement ${suffix}`;

    await upsertUser({ openId: ownerOpenId, name: ownerName, role: "user" });
    await upsertUser({ openId: viewerOpenId, name: `Viewer ${suffix}`, role: "user" });
    const owner = await getUserByOpenId(ownerOpenId);
    const viewer = await getUserByOpenId(viewerOpenId);
    expect(owner).toBeDefined();
    expect(viewer).toBeDefined();
    if (!owner || !viewer) throw new Error("Public profile test users were not created");

    const db = await getDb();
    if (!db) throw new Error("Database unavailable for public profile test");
    await db.insert(achievements).values({ name: achievementName, category: "community" });
    const achievement = (await getAchievements()).find((entry) => entry.name === achievementName);
    if (!achievement) throw new Error("Public profile test achievement was not created");
    await unlockAchievement(owner.id, achievement.id);

    const caller = appRouter.createCaller(createContext(viewer));
    const result = await caller.profile.getPublic({ userId: owner.id });

    expect(result).toMatchObject({
      userId: owner.id,
      name: ownerName,
      achievements: 1,
    });
  });
});
