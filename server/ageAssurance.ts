import { users, guardianLinks, educationCompletions } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";

export type AgeTier = "unverified" | "sprout" | "explorer" | "builder" | "architect" | "guardian";

export function deriveAgeTier(dateOfBirth: Date | string | null, tierOverride?: boolean): AgeTier {
  if (!dateOfBirth) return "unverified";
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return "unverified";

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 5) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Account creation not permitted for under-5 members." });
  }

  if (age >= 18) return "guardian";
  if (age >= 16) return "architect";
  if (age >= 13) return "builder";
  if (age >= 9) return "explorer";
  return "sprout";
}

export async function checkAgeTierPermission(
  userId: number,
  dateOfBirth: Date | null,
  action: "chat" | "post" | "comment" | "dm" | "external_link" | "external_video" | "commission"
): Promise<boolean> {
  const tier = deriveAgeTier(dateOfBirth);
  
  if (tier === "sprout") {
    if (["chat", "post", "comment", "dm", "external_link", "external_video"].includes(action)) {
      return false;
    }
  } else if (tier === "explorer") {
    if (["dm", "external_link"].includes(action)) {
      return false;
    }
  } else if (tier === "builder") {
    if (["dm"].includes(action)) {
      return false;
    }
  }

  return true;
}

export async function recordEducationCompletion(userId: number, moduleKey: string, score?: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  try {
    await db.insert(educationCompletions).values({
      userId,
      moduleKey,
      score: score ?? null,
      completedAt: new Date(),
    }).onDuplicateKeyUpdate({ set: { completedAt: new Date(), score: score ?? null } });
    return { success: true };
  } catch (error) {
    console.error("[AgeAssurance] Failed to record education completion:", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to record education completion" });
  }
}

export async function checkEducationGate(userId: number, moduleKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const [record] = await db.select().from(educationCompletions)
      .where(and(eq(educationCompletions.userId, userId), eq(educationCompletions.moduleKey, moduleKey)))
      .limit(1);
    return !!record;
  } catch (error) {
    return false;
  }
}
