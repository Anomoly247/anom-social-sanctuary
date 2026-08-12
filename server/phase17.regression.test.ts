import { describe, it, expect } from "vitest";
import { takeModerationAction, getModerationQueue } from "./moderation";

describe("Sanctuary Safety Layer - Phase 17 Comprehensive Regression Coverage", () => {
  it("refuses ambassador from performing suspend or ban actions", async () => {
    try {
      await takeModerationAction(1, "ambassador", 2, "user", 2, "suspend", "Ambassador suspension test");
      expect.fail("Should have thrown FORBIDDEN");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }

    try {
      await takeModerationAction(1, "ambassador", 2, "user", 2, "ban", "Ambassador ban test");
      expect.fail("Should have thrown FORBIDDEN");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("refuses moderator from performing ban actions or role assignments", async () => {
    try {
      await takeModerationAction(1, "moderator", 2, "user", 2, "ban", "Moderator ban test");
      expect.fail("Should have thrown FORBIDDEN");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }

    try {
      await takeModerationAction(1, "moderator", 2, "user", 2, "assign_role" as any, "Moderator role assignment test");
      expect.fail("Should have thrown FORBIDDEN");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("refuses users or lower-tier roles from self-escalation or unauthorized actions", async () => {
    try {
      await takeModerationAction(1, "user", 2, "user", 2, "warn", "User warning test");
      expect.fail("Should have thrown FORBIDDEN");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }

    // Test self-escalation or unauthorized role promotion attempt
    try {
      await takeModerationAction(1, "user", 1, "user", 1, "assign_role" as any, "Self-escalation test");
      expect.fail("Should have thrown FORBIDDEN");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("validates ambassador mute duration limit (max 24h)", async () => {
    try {
      await takeModerationAction(1, "ambassador", 2, "user", 2, "mute", "Mute > 24h test", undefined, 48);
      expect.fail("Should have thrown BAD_REQUEST");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });

  it("exports getModerationQueue and takeModerationAction successfully", () => {
    expect(typeof getModerationQueue).toBe("function");
    expect(typeof takeModerationAction).toBe("function");
  });
});
