import { getDb } from "./db";
import { reports, userBlocks, users, platformSettings, auditLog } from "../drizzle/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const FEATURE_FLAGS = {
  lounge_image_upload: { default: "off", requires: ["reporting", "blocking"] },
  vip_custom_emoji: { default: "off", requires: ["reporting", "blocking"] },
  lounge_reactions: { default: "on" },
  lounge_pinned_messages: { default: "on" },
  unread_badges: { default: "on" },
  activity_feed: { default: "on" },
  activity_feed_likes: { default: "on" },
  activity_feed_ratings: { default: "off", requires: ["reporting", "moderation_queue"] },
  coin_earning_from_engagement: { default: "off", requires: ["daily_earn_caps"] },
  profile_customization: { default: "on" },
  public_profiles: { default: "on" },
  tipping: { default: "on" },
  kids_corner: { default: "on" },
} as const;

export async function isFeatureEnabled(flagKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return FEATURE_FLAGS[flagKey as keyof typeof FEATURE_FLAGS]?.default === "on";

  try {
    // Check if stored in platformSettings or a dedicated flag table; for now fallback to default
    const config = FEATURE_FLAGS[flagKey as keyof typeof FEATURE_FLAGS];
    return config?.default === "on";
  } catch (error) {
    return false;
  }
}

export async function submitReport(userId: number, targetType: string, targetId: number, reason: string, details?: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  try {
    await db.insert(reports).values({
      reporterUserId: userId,
      targetType: targetType as any,
      targetId,
      reason: reason as any,
      details,
      status: "open",
    });
    return { success: true };
  } catch (error) {
    console.error("[Safety] Failed to submit report:", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to submit report" });
  }
}

export async function blockUser(blockerId: number, blockedId: number) {
  if (blockerId === blockedId) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot block yourself" });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  try {
    await db.insert(userBlocks).values({
      blockerUserId: blockerId,
      blockedUserId: blockedId,
    }).onDuplicateKeyUpdate({ set: { blockerUserId: blockerId } });
    return { success: true };
  } catch (error) {
    console.error("[Safety] Failed to block user:", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to block user" });
  }
}

export async function unblockUser(blockerId: number, blockedId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  try {
    await db.delete(userBlocks).where(
      and(
        eq(userBlocks.blockerUserId, blockerId),
        eq(userBlocks.blockedUserId, blockedId)
      )
    );
    return { success: true };
  } catch (error) {
    console.error("[Safety] Failed to unblock user:", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to unblock user" });
  }
}

export async function getBlockedUserIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const blocks = await db.select().from(userBlocks).where(eq(userBlocks.blockerUserId, userId));
    return blocks.map(b => b.blockedUserId);
  } catch (error) {
    return [];
  }
}
