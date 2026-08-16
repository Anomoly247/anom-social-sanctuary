import { describe, it, expect } from "vitest";
import { BUILT_IN_SAFETY_PREREQUISITES, FEATURE_REGISTRY, getAllFeatureFlags, setFeatureFlag } from "./featureFlags";

describe("Sanctuary Safety Layer - Phase 14 Feature Flag Registry", () => {
  it("defines lounge_image_upload and vip_custom_emoji as default off", () => {
    expect(FEATURE_REGISTRY.lounge_image_upload.default).toBe("off");
    expect(FEATURE_REGISTRY.vip_custom_emoji.default).toBe("off");
  });

  it("returns default flags correctly", async () => {
    const flags = await getAllFeatureFlags();
    expect(flags.lounge_image_upload).toBe(false);
    expect(flags.vip_custom_emoji).toBe(false);
  });

  it("treats required reporting, blocking, moderation, and cap systems as built-in safeguards", async () => {
    const flags = await getAllFeatureFlags();
    const allFlags = flags as Record<string, boolean>;

    expect(BUILT_IN_SAFETY_PREREQUISITES).toEqual({
      reporting: true,
      blocking: true,
      moderation_queue: true,
      daily_earn_caps: true,
    });
    expect(allFlags.reporting).toBe(true);
    expect(allFlags.blocking).toBe(true);
    expect(allFlags.moderation_queue).toBe(true);
    expect(allFlags.daily_earn_caps).toBe(true);
  });

  it("keeps activity feed ratings locked when the configurable activity feed is off", () => {
    expect(FEATURE_REGISTRY.activity_feed_ratings.requires).toContain("activity_feed");
  });

  it("allows a safety-gated feature to be enabled when mandatory safeguards are active", async () => {
    await setFeatureFlag(1, "lounge_image_upload", false);

    try {
      await expect(setFeatureFlag(1, "lounge_image_upload", true)).resolves.toMatchObject({
        success: true,
        flags: { lounge_image_upload: true },
      });
    } finally {
      await setFeatureFlag(1, "lounge_image_upload", false);
    }
  });
});
