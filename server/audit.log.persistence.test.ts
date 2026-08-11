import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { auditLog } from "../drizzle/schema";
import { createAuditLog, getAuditLogs, getDb } from "./db";

const testAction = `test_audit_persistence_${Date.now()}_${Math.random().toString(36).slice(2)}`;

describe("audit log persistence", () => {
  afterEach(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(auditLog).where(eq(auditLog.action, testAction));
    }
  });

  it("persists and retrieves an admin moderation audit entry", async () => {
    const db = await getDb();
    if (!db) return;

    await createAuditLog({
      userId: 1,
      action: testAction,
      entityType: "user",
      entityId: 7,
      details: {
        targetEmail: "audit-target@example.com",
        previousStatus: "active",
        newStatus: "suspended",
      },
    });

    const logs = await getAuditLogs(1000);
    const persisted = logs.find((log) => log.action === testAction);

    expect(persisted).toMatchObject({
      userId: 1,
      entityType: "user",
      entityId: 7,
      userEmail: "bethmarieshanley6@gmail.com",
    });
    expect(persisted?.details).toMatchObject({
      targetEmail: "audit-target@example.com",
      newStatus: "suspended",
    });
  });
});
