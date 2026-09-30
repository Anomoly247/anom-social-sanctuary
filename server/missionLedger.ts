import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb, getOrCreateUserProfile } from "./db";
import { coinTransactions, globalMissions, missionContributions, userProfiles } from "../drizzle/schema";

export const MISSION_CATALOG = [
  {
    id: "welcome-to-ao",
    name: "Welcome to AO",
    description: "Choose a house and take your first step into the connected universe.",
    reward: "25.00",
  },
  {
    id: "play-with-purpose",
    name: "Play With Purpose",
    description: "Complete a connected game or creative activity from an AO destination.",
    reward: "50.00",
  },
  {
    id: "make-something-kind",
    name: "Make Something Kind",
    description: "Create, share, or complete a kid-safe creative activity.",
    reward: "40.00",
  },
] as const;

function cents(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole || "0") * BigInt(100) + BigInt((fraction + "00").slice(0, 2));
}

function money(value: bigint) {
  return `${value / BigInt(100)}.${(value % BigInt(100)).toString().padStart(2, "0")}`;
}

function catalogMission(missionId: string) {
  return MISSION_CATALOG.find(mission => mission.id === missionId);
}

export async function listGlobalMissions() {
  const db = await getDb();
  if (!db) return MISSION_CATALOG;

  const stored = await db.select().from(globalMissions);
  return stored.length > 0 ? stored : MISSION_CATALOG;
}

export async function getMissionStatus(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(missionContributions).where(eq(missionContributions.userId, userId));
}

export async function completeGlobalMission(input: {
  userId: number;
  missionId: string;
  eventId: string;
  source: string;
  house?: string;
  mount?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ledger database is unavailable" });

  await getOrCreateUserProfile(input.userId);

  return db.transaction(async tx => {
    const existing = await tx
      .select()
      .from(missionContributions)
      .where(and(
        eq(missionContributions.userId, input.userId),
        eq(missionContributions.missionId, input.missionId),
        eq(missionContributions.eventId, input.eventId),
      ))
      .limit(1);

    if (existing.length > 0) {
      const profile = await tx.select().from(userProfiles).where(eq(userProfiles.userId, input.userId)).limit(1);
      return {
        completed: true,
        duplicate: true,
        reward: existing[0].reward,
        balance: profile[0]?.anomCoinBalance || "0.00",
      };
    }

    const storedMission = await tx.select().from(globalMissions).where(eq(globalMissions.id, input.missionId)).limit(1);
    const mission = storedMission[0] || catalogMission(input.missionId);
    if (!mission || ("active" in mission && !mission.active)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Mission is not active" });
    }

    const profile = await tx.select().from(userProfiles).where(eq(userProfiles.userId, input.userId)).limit(1);
    if (!profile[0]) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "User profile is unavailable" });

    const reward = mission.reward;
    const newBalance = money(cents(profile[0].anomCoinBalance || "0") + cents(reward));

    const contribution = await tx.insert(missionContributions).values({
      userId: input.userId,
      missionId: input.missionId,
      eventId: input.eventId,
      source: input.source,
      house: input.house,
      mount: input.mount,
      reward,
    });

    await tx.update(userProfiles)
      .set({ anomCoinBalance: newBalance })
      .where(eq(userProfiles.userId, input.userId));

    await tx.insert(coinTransactions).values({
      userId: input.userId,
      amount: reward,
      type: "earn",
      reason: `mission:${input.missionId}`,
      source: "Mission",
      relatedId: Number(contribution[0].insertId),
      balanceAfter: newBalance,
    });

    return { completed: true, duplicate: false, reward, balance: newBalance };
  });
}
