import { describe, it, expect } from "vitest";
import { FEATURE_REGISTRY, getAllFeatureFlags } from "./featureFlags";

describe("Phase 14 Feature Flag Gate Verification", () => {
  it("verifies default-off status of risky UGC features", () => {
    expect(FEATURE_REGISTRY.lounge_image_upload.default).toBe("off");
    expect(FEATURE_REGISTRY.vip_custom_emoji.default).toBe("off");
  });

  it("verifies getAllFeatureFlags exposes mutable risky feature settings as booleans", async () => {
    const flags = await getAllFeatureFlags();
    expect(typeof flags.lounge_image_upload).toBe("boolean");
    expect(typeof flags.vip_custom_emoji).toBe("boolean");
  });
});
