import { describe, it, expect } from "vitest";
import { takeModerationAction, getModerationQueue } from "./moderation";

describe("Sanctuary Safety Layer - Phase 17 Ambassador Gate & Moderation Queue", () => {
  it("defines getModerationQueue and takeModerationAction functions", () => {
    expect(typeof getModerationQueue).toBe("function");
    expect(typeof takeModerationAction).toBe("function");
  });

  it("refuses ambassador from performing suspend or ban actions", async () => {
    try {
      await takeModerationAction(1, "ambassador", 2, "user", 2, "suspend", "Testing ambassador suspension restriction");
      expect.fail("Should have thrown FORBIDDEN");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("refuses ambassador from muting more than 24 hours", async () => {
    try {
      await takeModerationAction(1, "ambassador", 2, "user", 2, "mute", "Testing mute duration limit", undefined, 48);
      expect.fail("Should have thrown BAD_REQUEST");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });
});
