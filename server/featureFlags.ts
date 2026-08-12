import { getDb } from "./db";
import { platformSettings, auditLog } from "../drizzle/schema";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const FEATURE_REGISTRY = {
  lounge_image_upload: { default: "off", label: "Lounge Image Upload", requires: ["reporting", "blocking"], description: "Allows members to upload and share images in lounge chat." },
  vip_custom_emoji: { default: "off", label: "VIP Custom Animated Emoji", requires: ["reporting", "blocking"], description: "Allows VIP members to use animated custom reactions." },
  lounge_reactions: { default: "on", label: "Lounge Emoji Reactions", description: "Enables emoji reaction buttons and counts on messages." },
  lounge_pinned_messages: { default: "on", label: "Lounge Pinned Messages", description: "Allows lounge owners to pin important messages." },
  unread_badges: { default: "on", label: "Unread Message Badges", description: "Shows unread message counts on lounge navigation links." },
  activity_feed: { default: "on", label: "Community Activity Feed", description: "Streams recent lounge milestones and announcements." },
  activity_feed_likes: { default: "on", label: "Activity Feed Likes", description: "Allows members to like feed items." },
  activity_feed_ratings: { default: "off", label: "Activity Feed Ratings", requires: ["reporting", "moderation_queue"], description: "Allows rating feed items for Anom Coins." },
  coin_earning_from_engagement: { default: "off", label: "Coin Earning from Engagement", requires: ["daily_earn_caps"], description: "Earn Anom Coins through engagement." },
  profile_customization: { default: "on", label: "Profile Customization", description: "Allows bio, avatar, and theme customization." },
  public_profiles: { default: "on", label: "Public Profiles", description: "Displays public member profiles." },
  tipping: { default: "on", label: "Tipping", description: "Enables tipping between users." },
  kids_corner: { default: "on", label: "Anom's Corner", description: "Enables educational and family content." },
} as const;

export type FlagKey = keyof typeof FEATURE_REGISTRY;

export async function getAllFeatureFlags(): Promise<Record<FlagKey, boolean>> {
  const db = await getDb();
  const flags: Record<string, boolean> = {};

  // Initialize defaults
  for (const [key, config] of Object.entries(FEATURE_REGISTRY)) {
    flags[key] = config.default === "on";
  }

  if (!db) return flags as Record<FlagKey, boolean>;

  try {
    // Check if platformSettings table has a flags json column or similar, otherwise check table columns
    const [settings] = await db.select().from(platformSettings).limit(1);
    if (settings && (settings as any).featureFlags) {
      const stored = (settings as any).featureFlags as Record<string, boolean>;
      for (const key of Object.keys(FEATURE_REGISTRY)) {
        if (stored[key] !== undefined) {
          flags[key] = stored[key];
        }
      }
    }
  } catch (error) {
    // Fallback to defaults
  }

  return flags as Record<FlagKey, boolean>;
}

export async function isFeatureEnabled(flagKey: FlagKey): Promise<boolean> {
  const flags = await getAllFeatureFlags();
  return flags[flagKey] ?? false;
}

export async function enforceFeatureFlag(flagKey: FlagKey) {
  const enabled = await isFeatureEnabled(flagKey);
  if (!enabled) {
    const config = FEATURE_REGISTRY[flagKey];
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Feature '${config?.label || flagKey}' is currently disabled by platform administrators.`,
    });
  }
}

export async function setFeatureFlag(userId: number, flagKey: FlagKey, value: boolean) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  // Check prerequisites if turning on
  if (value) {
    const config = FEATURE_REGISTRY[flagKey];
    if (config && "requires" in config && config.requires) {
      const allFlags = await getAllFeatureFlags();
      for (const req of config.requires) {
        if (allFlags[req as FlagKey] === false || allFlags[req as FlagKey] === undefined) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Cannot enable '${config.label}': required prerequisite '${req}' is disabled.`,
          });
        }
      }
    }
  }

  try {
    let [settings] = await db.select().from(platformSettings).limit(1);
    let currentFlags: Record<string, boolean> = {};

    if (!settings) {
      await db.insert(platformSettings).values({ siteName: "Anom Artsy" });
      [settings] = await db.select().from(platformSettings).limit(1);
    }

    if (settings && (settings as any).featureFlags) {
      currentFlags = { ...((settings as any).featureFlags as Record<string, boolean>) };
    } else {
      for (const [k, c] of Object.entries(FEATURE_REGISTRY)) {
        currentFlags[k] = c.default === "on";
      }
    }

    currentFlags[flagKey] = value;

    // Update platformSettings with json feature flags
    await db.execute(sql`UPDATE platform_settings SET feature_flags = ${JSON.stringify(currentFlags)} WHERE id = ${settings.id}`);

    // Log to auditLog
    await db.insert(auditLog).values({
      userId,
      action: "toggle_feature_flag",
      entityType: "feature_flag",
      entityId: 0,
      details: { flagKey, value },
    });

    return { success: true, flags: currentFlags };
  } catch (error) {
    console.error("[FeatureFlags] Failed to toggle feature flag:", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update feature flag" });
  }
}

export async function disableAllUgc(userId: number) {
  const ugcFlags: FlagKey[] = ["lounge_image_upload", "vip_custom_emoji", "lounge_reactions"];
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  let [settings] = await db.select().from(platformSettings).limit(1);
  if (!settings) {
    await db.insert(platformSettings).values({ siteName: "Anom Artsy" });
    [settings] = await db.select().from(platformSettings).limit(1);
  }

  let currentFlags: Record<string, boolean> = {};
  if (settings && (settings as any).featureFlags) {
    currentFlags = { ...((settings as any).featureFlags as Record<string, boolean>) };
  } else {
    for (const [k, c] of Object.entries(FEATURE_REGISTRY)) {
      currentFlags[k] = c.default === "on";
    }
  }

  for (const flag of ugcFlags) {
    currentFlags[flag] = false;
  }

  await db.execute(sql`UPDATE platform_settings SET feature_flags = ${JSON.stringify(currentFlags)} WHERE id = ${settings.id}`);

  await db.insert(auditLog).values({
    userId,
    action: "disable_all_ugc",
    entityType: "feature_flag",
    entityId: 0,
    details: { disabledFlags: ugcFlags },
  });

  return { success: true, flags: currentFlags };
}
