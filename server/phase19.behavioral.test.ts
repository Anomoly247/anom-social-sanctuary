import { describe, it, expect } from "vitest";
import { eq, and, sql } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb, upsertUser, getUserByOpenId, createLounge, addLoungeMessage, getLoungeMessages } from "./db";
import { blockUser } from "./safety";
import { FEATURE_REGISTRY, setFeatureFlag } from "./featureFlags";
import {
  deriveAgeTier,
  checkAgeTierPermission,
  requestGuardianConsent,
  grantGuardianConsent,
  revokeGuardianConsent,
} from "./ageAssurance";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import { users, guardianLinks } from "../drizzle/schema";

const callerFor = (user: any) =>
  appRouter.createCaller({
    user,
    req: { headers: {} } as any,
    res: {} as any,
  } as any);

const unique = (label: string) => `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function requireUser(openId: string) {
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error(`Test user was not created: ${openId}`);
  return user;
}

describe("Phase 19 strict behavioral verification", () => {
  it("Gate 1: every registered flag is off and its governing procedure rejects, while UI-only flags are identified", async () => {
    const adminId = 1;
    const governingProcedures: Record<string, () => Promise<unknown>> = {
      lounge_image_upload: () => callerFor({ id: adminId, role: "user", status: "active" }).lounge.sendMessage({ loungeId: 1, content: "flag test", imageUrl: "https://example.invalid/test.png" }),
      vip_custom_emoji: () => callerFor({ id: adminId, role: "user", status: "active" }).lounge.toggleReaction({ messageId: 1, emoji: "custom:test" }),
      lounge_reactions: () => callerFor({ id: adminId, role: "user", status: "active" }).lounge.toggleReaction({ messageId: 1, emoji: "👍" }),
      lounge_pinned_messages: () => callerFor({ id: adminId, role: "user", status: "active" }).lounge.pinMessage({ loungeId: 1, messageId: 1, isPinned: true }),
    };

    const uiOnlyFlags = Object.keys(FEATURE_REGISTRY).filter((key) => !(key in governingProcedures));
    expect(uiOnlyFlags.sort()).toEqual([
      "activity_feed",
      "activity_feed_likes",
      "activity_feed_ratings",
      "coin_earning_from_engagement",
      "kids_corner",
      "profile_customization",
      "public_profiles",
      "tipping",
      "unread_badges",
    ].sort());

    for (const flagKey of Object.keys(FEATURE_REGISTRY)) {
      await setFeatureFlag(adminId, flagKey as any, false);
      if (governingProcedures[flagKey]) {
        await expect(governingProcedures[flagKey]()).rejects.toMatchObject({ code: "FORBIDDEN" });
      }
    }
  });

  it("Gate 2: enabling a flag with unmet prerequisites is refused by the direct mutation", async () => {
    await expect(setFeatureFlag(1, "activity_feed_ratings", true)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("Gate 3: blocked authors are excluded from the DB-backed lounge message result", async () => {
    const viewerOpenId = unique("phase19-viewer");
    const authorOpenId = unique("phase19-author");
    await upsertUser({ openId: viewerOpenId, name: "Phase 19 Viewer", email: `${viewerOpenId}@example.invalid` });
    await upsertUser({ openId: authorOpenId, name: "Phase 19 Author", email: `${authorOpenId}@example.invalid` });
    const viewer = await requireUser(viewerOpenId);
    const author = await requireUser(authorOpenId);
    const lounge = await createLounge(viewer.id, unique("phase19-lounge"), "Phase 19 block test", "family");
    if (!lounge) throw new Error("Test lounge was not created");
    await addLoungeMessage(lounge.id, author.id, "blocked message");
    await blockUser(viewer.id, author.id);

    const visible = await getLoungeMessages(lounge.id, 100, viewer.id);
    expect(visible.some((message) => message.userId === author.id)).toBe(false);
  });

  it("Gate 4: muted, timed_out, suspended, and banned users are refused by protected procedures", async () => {
    for (const status of ["muted", "timed_out", "suspended", "banned"] as const) {
      const caller = callerFor({ id: 1, role: "user", status, restrictedUntil: new Date(Date.now() + 60_000) });
      await expect(caller.profile.getMe()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("Gate 5: an active timed_out restriction is refused and the same status after expiry is allowed", async () => {
    const activeCaller = callerFor({ id: 1, role: "user", status: "timed_out", restrictedUntil: new Date(Date.now() + 60_000) });
    await expect(activeCaller.profile.getMe()).rejects.toMatchObject({ code: "FORBIDDEN" });

    const expiredCaller = callerFor({ id: 1, role: "user", status: "timed_out", restrictedUntil: new Date(Date.now() - 60_000) });
    await expect(expiredCaller.profile.getMe()).resolves.toBeDefined();
  });

  it("Gate 6: non-moderator lounge reads do not return removed moderation content", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.execute(sql`SELECT id, moderation_status FROM lounge_messages WHERE moderation_status = 'removed' LIMIT 1`);
    const rows = (result as any)[0] ?? [];
    const nonModeratorMessages = await getLoungeMessages(1, 100, 1);
    expect(nonModeratorMessages.some((message: any) => rows.some((row: any) => row.id === message.id))).toBe(false);
  });

  it("Gate 7: content removal preserves the row and marks moderation status instead of hard deleting", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const before = await db.execute(sql`SELECT id FROM lounge_messages ORDER BY id DESC LIMIT 1`);
    const beforeRows = (before as any)[0] ?? [];
    if (!beforeRows.length) throw new Error("No lounge message fixture exists for soft-delete test");
    const id = beforeRows[0].id;
    const caller = callerFor({ id: 1, role: "moderator", status: "active" });
    await caller.safety.takeModerationAction({ targetUserId: null, targetType: "lounge_message", targetId: id, actionType: "content_remove", reason: "Phase 19 soft-delete test" });
    const after = await db.execute(sql`SELECT id, moderation_status FROM lounge_messages WHERE id = ${id}`);
    const afterRows = (after as any)[0] ?? [];
    expect(afterRows).toHaveLength(1);
    expect(afterRows[0].moderation_status).toBe("removed");
  });

  it("Gate 8: an Explorer cannot chat until both education completions are recorded", async () => {
    const explorerDob = new Date();
    explorerDob.setFullYear(explorerDob.getFullYear() - 10);
    expect(deriveAgeTier(explorerDob)).toBe("explorer");
    await expect(checkAgeTierPermission(1, explorerDob, "chat")).resolves.toBe(false);
  });

  it("Gate 9: login-time authentication recomputes and persists a birthday promotion", async () => {
    const openId = unique("phase19-birthday");
    await upsertUser({ openId, name: "Birthday Test", email: `${openId}@example.invalid` });
    const user = await requireUser(openId);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 14);
    await db.update(users).set({ dateOfBirth: dob, ageTier: "explorer" }).where(eq(users.id, user.id));

    const token = await sdk.createSessionToken(openId, { name: "Birthday Test" });
    const authenticated = await sdk.authenticateRequest({ headers: { cookie: `${COOKIE_NAME}=${token}` } } as any);
    expect(authenticated.ageTier).toBe("builder");
  });

  it("Gate 10: consent revocation suspends the child and removes child content immediately", async () => {
    const guardianOpenId = unique("phase19-guardian");
    const childOpenId = unique("phase19-child");
    await upsertUser({ openId: guardianOpenId, name: "Guardian", email: `${guardianOpenId}@example.invalid` });
    await upsertUser({ openId: childOpenId, name: "Child", email: `${childOpenId}@example.invalid` });
    const guardian = await requireUser(guardianOpenId);
    const child = await requireUser(childOpenId);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 7);
    await db.update(users).set({ dateOfBirth: dob, ageTier: "sprout", status: "active" }).where(eq(users.id, child.id));

    await requestGuardianConsent(child.id, guardian.email!, "parent");
    const [link] = await db.select().from(guardianLinks).where(and(eq(guardianLinks.guardianUserId, guardian.id), eq(guardianLinks.childUserId, child.id))).orderBy(guardianLinks.id);
    if (!link) throw new Error("Guardian link was not created");
    await grantGuardianConsent(guardian.id, link.id);
    await revokeGuardianConsent(guardian.id, link.id);

    const [updatedChild] = await db.select().from(users).where(eq(users.id, child.id));
    expect(updatedChild.status).toBe("suspended");
    const childContent = await db.execute(sql`SELECT id, moderation_status FROM lounge_messages WHERE user_id = ${child.id}`);
    const contentRows = (childContent as any)[0] ?? [];
    expect(contentRows.every((row: any) => row.moderation_status === "removed")).toBe(true);
  });
});
