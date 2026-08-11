import { describe, it, expect } from "vitest";
import { FEATURE_REGISTRY, getAllFeatureFlags, isFeatureEnabled } from "./featureFlags";

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
});
