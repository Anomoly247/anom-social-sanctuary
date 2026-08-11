import { getDb } from "./db";
import { users, guardianLinks } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export function calculateAgeBracket(dateOfBirth: Date): "under_13" | "teen_13_17" | "adult_18_plus" {
  const diffMs = Date.now() - dateOfBirth.getTime();
  const ageDate = new Date(diffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  if (age < 13) return "under_13";
  if (age >= 13 && age <= 17) return "teen_13_17";
  return "adult_18_plus";
}

export async function setUserDateOfBirth(userId: number, dobDate: Date) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const bracket = calculateAgeBracket(dobDate);

  try {
    await db.update(users)
      .set({ dateOfBirth: dobDate, ageBracket: bracket })
      .where(eq(users.id, userId));
    return { success: true, ageBracket: bracket };
  } catch (error) {
    console.error("[AgeAssurance] Failed to set date of birth:", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update date of birth" });
  }
}

export async function requestGuardianConsent(childUserId: number, guardianEmail: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  try {
    // Find guardian user by email
    const [guardian] = await db.select().from(users).where(eq(users.email, guardianEmail)).limit(1);
    if (!guardian) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Guardian user account not found for this email." });
    }

    await db.insert(guardianLinks).values({
      guardianUserId: guardian.id,
      childUserId,
      consentStatus: "pending",
      consentMethod: "email_verification",
    }).onDuplicateKeyUpdate({ set: { consentStatus: "pending" } });

    return { success: true, message: "Consent request sent to guardian." };
  } catch (error) {
    console.error("[AgeAssurance] Failed to request guardian consent:", error);
    throw error;
  }
}

export async function grantGuardianConsent(guardianId: number, linkId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  try {
    await db.update(guardianLinks)
      .set({ consentStatus: "granted", consentGrantedAt: new Date() })
      .where(and(eq(guardianLinks.id, linkId), eq(guardianLinks.guardianUserId, guardianId)));
    return { success: true };
  } catch (error) {
    console.error("[AgeAssurance] Failed to grant consent:", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to grant consent" });
  }
}
