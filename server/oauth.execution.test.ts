import { describe, it, expect, vi } from "vitest";
import { upsertUser } from "./db";
import { users } from "../drizzle/schema";

describe("OAuth User Upsert and Safety Schema Compatibility", () => {
  it("successfully performs upsertUser without throwing missing column errors", async () => {
    const mockUser = {
      openId: "test-oauth-openid-999",
      name: "OAuth Test User",
      email: "oauth@example.com",
      loginMethod: "google",
      lastSignedIn: new Date(),
    };

    // Verify upsertUser handles schema gracefully
    await expect(upsertUser(mockUser as any)).resolves.not.toThrow();
  });
});
