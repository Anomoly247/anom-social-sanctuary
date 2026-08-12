import { describe, expect, it } from "vitest";
import { deriveAgeTier } from "./ageAssurance";

export function calculateAgeBracket(dob: Date) {
  const tier = deriveAgeTier(dob);
  if (tier === "sprout" || tier === "explorer") return "under_13";
  if (tier === "builder" || tier === "architect") return "teen_13_17";
  return "adult_18_plus";
}
import { FEATURE_FLAGS } from "./safety";

describe("Safety Layer Work Order Tests", () => {
  it("calculates age bracket correctly", () => {
    const now = new Date();
    const childYear = now.getFullYear() - 10;
    const teenYear = now.getFullYear() - 15;
    const adultYear = now.getFullYear() - 25;

    expect(calculateAgeBracket(new Date(childYear, 0, 1))).toBe("under_13");
    expect(calculateAgeBracket(new Date(teenYear, 0, 1))).toBe("teen_13_17");
    expect(calculateAgeBracket(new Date(adultYear, 0, 1))).toBe("adult_18_plus");
  });

  it("defaults risky UGC features to off", () => {
    expect(FEATURE_FLAGS.lounge_image_upload.default).toBe("off");
    expect(FEATURE_FLAGS.vip_custom_emoji.default).toBe("off");
  });
});
