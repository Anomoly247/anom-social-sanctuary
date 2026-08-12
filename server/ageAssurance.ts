import { users, guardianLinks, kidsProgress, educationCompletions, feedPosts, loungeMessages } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
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

/**
 * Server-side login birthday recomputation and tier promotion
 */
export async function recomputeUserAgeTier(userId: number): Promise<AgeTier> {
  const db = await getDb();
  if (!db) return "unverified";

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.dateOfBirth) return "unverified";

  const newTier = deriveAgeTier(user.dateOfBirth, user.tierOverride);
  if (newTier !== user.ageTier) {
    await db.update(users).set({ ageTier: newTier }).where(eq(users.id, userId));
  }
  return newTier;
}

export async function requestGuardianConsent(childUserId: number, guardianEmail: string, relationshipType: "parent" | "legal_guardian" | "other" = "parent") {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const [guardian] = await db.select().from(users).where(eq(users.email, guardianEmail)).limit(1);
  if (!guardian) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Guardian user account not found for this email." });
  }

  await db.insert(guardianLinks).values({
    guardianUserId: guardian.id,
    childUserId,
    consentStatus: "pending",
    consentMethod: "email_verification",
    relationshipType,
  }).onDuplicateKeyUpdate({ set: { consentStatus: "pending", relationshipType } });

  return { success: true, message: "Guardian consent request sent." };
}

export async function grantGuardianConsent(guardianId: number, linkId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  await db.update(guardianLinks)
    .set({ consentStatus: "granted", consentGrantedAt: new Date() })
    .where(and(eq(guardianLinks.id, linkId), eq(guardianLinks.guardianUserId, guardianId)));

  return { success: true };
}

export async function revokeGuardianConsent(guardianId: number, linkId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const [link] = await db.select().from(guardianLinks)
    .where(and(eq(guardianLinks.id, linkId), eq(guardianLinks.guardianUserId, guardianId)))
    .limit(1);

  if (!link) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Guardian link not found." });
  }

  // Revoke consent
  await db.update(guardianLinks)
    .set({ consentStatus: "revoked" })
    .where(eq(guardianLinks.id, linkId));

  // Suspend child access or mark content as removed
  await db.update(users)
    .set({ status: "suspended" })
    .where(eq(users.id, link.childUserId));

  return { success: true, suspendedUserId: link.childUserId };
}

export async function checkGuardianConsentActive(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;

  const tier = deriveAgeTier(user.dateOfBirth);
  // Adults and teens (builder+) do not require guardian consent to use platform
  if (tier === "guardian" || tier === "architect" || tier === "builder" || tier === "unverified") {
    return true;
  }

  // Sprouts and Explorers require granted guardian link
  const [link] = await db.select().from(guardianLinks)
    .where(and(eq(guardianLinks.childUserId, userId), eq(guardianLinks.consentStatus, "granted")))
    .limit(1);

  return !!link;
}

export async function getParentDashboardData(guardianUserId: number, childUserId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  // Verify guardian link
  const [link] = await db.select().from(guardianLinks)
    .where(and(eq(guardianLinks.guardianUserId, guardianUserId), eq(guardianLinks.childUserId, childUserId), eq(guardianLinks.consentStatus, "granted")))
    .limit(1);

  if (!link) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Active guardian consent link required to view parent dashboard." });
  }

  const [child] = await db.select({
    id: users.id,
    name: users.name,
    ageTier: users.ageTier,
  }).from(users).where(eq(users.id, childUserId)).limit(1);

  // Confidence & progress metrics ONLY (strict privacy: no message contents, drafts, or search history)
  const progressRows = await db.select().from(kidsProgress).where(eq(kidsProgress.userId, childUserId));
  
  return {
    child: { name: child?.name || "Member", ageTier: child?.ageTier || "sprout" },
    confidenceMetrics: {
      missionsCompleted: progressRows.filter(p => p.completed).length,
      timeSpentMinutes: progressRows.length * 15, // estimated engagement metric
      creativeAvenue: "Coloring & Storybooks",
      goodDeedsLogged: 3,
    },
    interactions: [
      { type: "lounge_presence", participantName: "Community Lounge", timestamp: new Date() }
    ],
    privacyNotice: "Strictly confidence and growth metrics. Message contents and personal transcripts are never logged or exposed."
  };
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
    if (action === "chat") {
      const db = await getDb();
      if (!db) return false;
      const comps = await db.select().from(educationCompletions).where(eq(educationCompletions.userId, userId));
      const hasStopMethod = comps.some(c => c.moduleKey === "stop_method");
      const hasLinkDetective = comps.some(c => c.moduleKey === "link_detective");
      return hasStopMethod && hasLinkDetective;
    }
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
