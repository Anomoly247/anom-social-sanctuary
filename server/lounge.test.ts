import { describe, expect, it } from "vitest";
import { createLounge, getLoungeMembersWithUsers, getUserByOpenId, getUserLounges, upsertUser } from "./db";

describe("lounge db helper regression", () => {
  it("successfully queries user lounges without missing column errors", async () => {
    const loungesList = await getUserLounges(1);
    expect(Array.isArray(loungesList)).toBe(true);
  });

  it("adds the creator as an owner member when a lounge is created", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const openId = `lounge-owner-${suffix}`;
    await upsertUser({ openId, name: "Lounge Owner Regression" });

    const owner = await getUserByOpenId(openId);
    expect(owner).toBeDefined();
    if (!owner) throw new Error("Regression test owner was not created");

    const lounge = await createLounge(
      owner.id,
      `Owner membership ${suffix}`,
      "Regression test lounge",
      "family",
    );
    expect(lounge).toBeDefined();
    if (!lounge) throw new Error("Regression test lounge was not created");

    const members = await getLoungeMembersWithUsers(lounge.id);
    expect(members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: owner.id, role: "owner" }),
      ]),
    );
  });
});
