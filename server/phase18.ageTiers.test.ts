import { describe, it, expect } from "vitest";
import { deriveAgeTier, checkAgeTierPermission } from "./ageAssurance";

describe("Sanctuary Safety Layer - Phase 18 AO Age Tiers & Guardian Consent", () => {
  it("correctly derives age tiers from date of birth", () => {
    const today = new Date();
    
    // Sprout (5-8): age 7
    const sproutDob = new Date(today.getFullYear() - 7, today.getMonth(), today.getDate());
    expect(deriveAgeTier(sproutDob)).toBe("sprout");

    // Explorer (9-12): age 10
    const explorerDob = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    expect(deriveAgeTier(explorerDob)).toBe("explorer");

    // Builder (13-15): age 14
    const builderDob = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
    expect(deriveAgeTier(builderDob)).toBe("builder");

    // Architect (16-17): age 16
    const architectDob = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    expect(deriveAgeTier(architectDob)).toBe("architect");

    // Guardian (18+): age 25
    const guardianDob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    expect(deriveAgeTier(guardianDob)).toBe("guardian");

    // Unverified for null
    expect(deriveAgeTier(null)).toBe("unverified");
  });

  it("refuses account creation for under-5 members", () => {
    const today = new Date();
    const under5Dob = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
    expect(() => deriveAgeTier(under5Dob)).toThrowError(/under-5 members/);
  });

  it("enforces Sprout permission restrictions server-side", async () => {
    const today = new Date();
    const sproutDob = new Date(today.getFullYear() - 7, today.getMonth(), today.getDate());

    const canChat = await checkAgeTierPermission(1, sproutDob, "chat");
    expect(canChat).toBe(false);

    const canPost = await checkAgeTierPermission(1, sproutDob, "post");
    expect(canPost).toBe(false);

    const canComment = await checkAgeTierPermission(1, sproutDob, "comment");
    expect(canComment).toBe(false);

    const canDm = await checkAgeTierPermission(1, sproutDob, "dm");
    expect(canDm).toBe(false);

    const canExternalLink = await checkAgeTierPermission(1, sproutDob, "external_link");
    expect(canExternalLink).toBe(false);
  });

  it("enforces Explorer and Builder DM / external link restrictions", async () => {
    const today = new Date();
    const explorerDob = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    const builderDob = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());

    expect(await checkAgeTierPermission(2, explorerDob, "dm")).toBe(false);
    expect(await checkAgeTierPermission(2, explorerDob, "external_link")).toBe(false);
    expect(await checkAgeTierPermission(2, explorerDob, "chat")).toBe(true);

    expect(await checkAgeTierPermission(3, builderDob, "dm")).toBe(false);
    expect(await checkAgeTierPermission(3, builderDob, "post")).toBe(true);
  });
});
