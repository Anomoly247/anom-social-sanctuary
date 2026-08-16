import { beforeEach, describe, expect, it, vi } from "vitest";

const { fakeDb, storedFlags } = vi.hoisted(() => {
  const storedFlags: Record<string, boolean> = {
    lounge_image_upload: false,
    vip_custom_emoji: false,
  };

  const fakeDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        limit: vi.fn(async () => [{ id: 1, featureFlags: { ...storedFlags } }]),
      })),
    })),
    execute: vi.fn(async () => undefined),
    insert: vi.fn(() => ({
      values: vi.fn(async () => undefined),
    })),
  };

  return { fakeDb, storedFlags };
});

vi.mock("./db", () => ({
  getDb: vi.fn(async () => fakeDb),
}));

import { setFeatureFlag } from "./featureFlags";

describe("Feature Controls server mutation prerequisites", () => {
  beforeEach(() => {
    storedFlags.lounge_image_upload = false;
    storedFlags.vip_custom_emoji = false;
    vi.clearAllMocks();
  });

  it("enables Lounge Image Upload without a false reporting prerequisite rejection", async () => {
    await expect(setFeatureFlag(1, "lounge_image_upload", true)).resolves.toMatchObject({
      success: true,
      flags: { lounge_image_upload: true },
    });
  });

  it("enables VIP Custom Animated Emoji without a false reporting prerequisite rejection", async () => {
    await expect(setFeatureFlag(1, "vip_custom_emoji", true)).resolves.toMatchObject({
      success: true,
      flags: { vip_custom_emoji: true },
    });
  });
});
