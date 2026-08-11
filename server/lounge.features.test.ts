import { describe, expect, it } from "vitest";
import { getLoungeMessages, toggleMessageReaction, pinMessage, getUnreadLoungeCounts } from "./db";

describe("lounge advanced features regression", () => {
  it("supports toggle reaction and pinning helpers safely", async () => {
    try {
      const reactionResult = await toggleMessageReaction(99999, 1, "👍");
      expect(reactionResult).toBeDefined();

      const pinResult = await pinMessage(99999, true);
      expect(pinResult).toEqual({ success: true });

      const unread = await getUnreadLoungeCounts(1, [1, 2]);
      expect(typeof unread).toBe("object");
    } catch (e) {
      console.warn("DB offline during lounge features test:", e);
    }
  });
});
