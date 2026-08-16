import { describe, expect, it } from "vitest";
import { getUnmetConfigurablePrerequisites } from "../shared/featureFlagPrerequisites";

describe("Feature Controls configurable prerequisites", () => {
  it("locks activity feed ratings only when the configurable activity feed is off", () => {
    expect(getUnmetConfigurablePrerequisites("activity_feed_ratings", { activity_feed: false }))
      .toEqual(["activity_feed"]);
    expect(getUnmetConfigurablePrerequisites("activity_feed_ratings", { activity_feed: true }))
      .toEqual([]);
  });

  it("does not invent a configurable lock for features gated only by built-in safety safeguards", () => {
    expect(getUnmetConfigurablePrerequisites("lounge_image_upload", {})).toEqual([]);
    expect(getUnmetConfigurablePrerequisites("vip_custom_emoji", {})).toEqual([]);
  });
});
