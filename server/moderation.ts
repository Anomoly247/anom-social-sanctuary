import { getDb } from "./db";
import { reports, moderationActions, auditLog, users } from "../drizzle/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export async function getModerationQueue() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Sort with child_safety pinned to the top, then oldest first
    const openReports = await db
      .select()
      .from(reports)
      .where(sql`status IN ('open', 'in_review')`)
      .orderBy(
        sql`CASE WHEN reason = 'child_safety' THEN 0 ELSE 1 END`,
        asc(reports.createdAt)
      );
    return openReports;
  } catch (error) {
    console.error("[Moderation] Failed to get moderation queue:", error);
    return [];
  }
}

export async function takeModerationAction(
  moderatorId: number,
  moderatorRole: string,
  targetUserId: number | null,
  targetType: string | null,
  targetId: number | null,
  actionType: "warn" | "mute" | "timeout" | "content_remove" | "suspend" | "ban" | "reinstate",
  reason: string,
  reportId?: number,
  durationHours?: number
) {
  // Permission tiers check:
  // Ambassador: warn, mute (up to 24h), escalate — cannot suspend or ban, cannot timeout or remove content.
  // Moderator: adds timeout, content removal, suspend — cannot ban.
  // Admin/owner: adds ban, reinstate, role assignment.
  if (moderatorRole === "ambassador") {
    if (!["warn", "mute", "escalate"].includes(actionType)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Ambassadors can only warn, mute, or escalate reports." });
    }
    if (actionType === "mute" && durationHours && durationHours > 24) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Ambassadors can only mute up to 24 hours." });
    }
  } else if (moderatorRole === "moderator") {
    if (["ban", "reinstate", "assign_role"].includes(actionType)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Moderators cannot ban users or assign roles." });
    }
  } else if (moderatorRole !== "admin" && moderatorRole !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to take moderation actions." });
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  try {
    let expiresAt: Date | null = null;
    if (durationHours && (actionType === "mute" || actionType === "timeout")) {
      expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);
    }

    // Insert moderation action
    const [result] = await db.insert(moderationActions).values({
      moderatorUserId: moderatorId,
      targetUserId,
      targetType,
      targetId,
      actionType,
      reportId: reportId || null,
      reason,
      expiresAt,
    });

    // Update user status if targetUser is specified
    if (targetUserId) {
      let newStatus = "active";
      if (actionType === "mute") newStatus = "muted";
      if (actionType === "timeout") newStatus = "timed_out";
      if (actionType === "suspend") newStatus = "suspended";
      if (actionType === "ban") newStatus = "banned";
      if (actionType === "reinstate") newStatus = "active";

      await db.update(users)
        .set({ status: newStatus as any, restrictedUntil: expiresAt })
        .where(eq(users.id, targetUserId));
    }

    // If reportId provided, mark report as actioned
    if (reportId) {
      await db.update(reports)
        .set({ status: "actioned", resolutionNote: reason, assignedToUserId: moderatorId })
        .where(eq(reports.id, reportId));
    }

    // Write audit log entry
    await db.insert(auditLog).values({
      userId: moderatorId,
      action: `moderation_${actionType}`,
      entityType: targetType || "user",
      entityId: targetId || targetUserId || 0,
      details: { reason, targetUserId, actionType },
    });

    return { success: true };
  } catch (error) {
    console.error("[Moderation] Failed to take moderation action:", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to take moderation action" });
  }
}
