import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { getOrCreateUserProfile, getUserByOpenId, upsertUser } from "./db";
import { appRouter } from "./routers";

function createContext(user: NonNullable<TrpcContext["user"]>): TrpcContext {
  return {
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user,
  };
}

describe("profile settings persistence", () => {
  it("persists and reloads display name, bio, theme, and name color", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const openId = `profile-settings-${suffix}`;
    const displayName = `Sanctuary Artist ${suffix}`;
    const bio = `Persistence regression ${suffix}`;

    await upsertUser({ openId, name: "Initial Name", role: "user" });
    const initialUser = await getUserByOpenId(openId);
    expect(initialUser).toBeDefined();
    if (!initialUser) throw new Error("Profile persistence test user was not created");

    const caller = appRouter.createCaller(createContext(initialUser));
    await caller.profile.updateProfile({ name: displayName, bio });
    await caller.settings.updateTheme({ theme: "purple" });
    await caller.settings.updateNameColor({ nameColor: "#ffd700" });

    const reloadedUser = await getUserByOpenId(openId);
    const reloadedProfile = await getOrCreateUserProfile(initialUser.id);
    const reloadedSettings = await caller.settings.getSettings();

    expect(reloadedUser?.name).toBe(displayName);
    expect(reloadedProfile).toMatchObject({
      bio,
      neonTheme: "purple",
      nameColor: "#ffd700",
    });
    expect(reloadedSettings).toMatchObject({
      bio,
      neonTheme: "purple",
      nameColor: "#ffd700",
    });
  });
});
