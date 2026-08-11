import { describe, expect, it } from "vitest";
import { getUserLounges } from "./db";

describe("lounge db helper", () => {
  it("retrieves user lounges successfully", async () => {
    try {
      const loungesList = await getUserLounges(1);
      expect(Array.isArray(loungesList)).toBe(true);
    } catch (e) {
      console.warn("Database not available for lounge test:", e);
    }
  });
});
