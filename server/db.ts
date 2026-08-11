import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, userProfiles, decorationPackages, coinTransactions, achievements, userAchievements, lounges, loungeMembers, loungeMessages, kidsProgress, collaborationProjects, collaborationMembers, collaborationTasks, collaborationUpdates, platformSettings, InsertPlatformSettings, auditLog, vipTiers, userVipSubscriptions, vipBenefitsLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// Lazily create the drizzle instance using mysql2 pool
// This matches the connection method used in dbInit.ts for consistency
export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      console.log("[Database] Initializing database connection...");
      // Create a pool (not a single connection) for better connection management
      _pool = mysql.createPool(ENV.databaseUrl);
      _db = drizzle(_pool);
      console.log("[Database] ✓ Database connection established");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateUserProfile(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user profile: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

    if (result.length > 0) {
      return result[0];
    }

    // Create new profile if it doesn't exist
    await db.insert(userProfiles).values({
      userId,
      level: 1,
      xp: 0,
      anomCoinBalance: "0",
      neonTheme: "magenta",
      decorationPackageIds: [],
    });

    const newProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return newProfile.length > 0 ? newProfile[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get or create user profile:", error);
    throw error;
  }
}

export async function getDecorationPackages() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get decoration packages: database not available");
    return [];
  }

  try {
    return await db.select().from(decorationPackages);
  } catch (error) {
    console.error("[Database] Failed to get decoration packages:", error);
    throw error;
  }
}

export async function updateUserProfile(userId: number, updates: Partial<typeof userProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user profile: database not available");
    return undefined;
  }

  try {
    // Ensure profile exists before updating
    await getOrCreateUserProfile(userId);
    
    await db.update(userProfiles).set(updates).where(eq(userProfiles.userId, userId));
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to update user profile:", error);
    throw error;
  }
}

export async function getCoinBalance(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return result.length > 0 ? result[0].anomCoinBalance : undefined;
  } catch (error) {
    console.error("[Database] Failed to get coin balance:", error);
    throw error;
  }
}

export async function addCoinTransaction(userId: number, type: "earn" | "spend", amount: string, reason: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // Ensure profile exists
    await getOrCreateUserProfile(userId);
    
    // Get current balance
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (!profile.length) return undefined;

    const currentBalance = profile[0].anomCoinBalance || "0";
    const current = BigInt(currentBalance);
    const delta = BigInt(amount);
    const newBalance = type === "earn" ? current + delta : current - delta;

    // Update profile balance
    await db.update(userProfiles).set({ anomCoinBalance: newBalance.toString() }).where(eq(userProfiles.userId, userId));

    // Record transaction
    await db.insert(coinTransactions).values({
      userId,
      type,
      amount,
      reason,
      balanceAfter: newBalance.toString(),
    });

    return { newBalance: newBalance.toString() };
  } catch (error) {
    console.error("[Database] Failed to add coin transaction:", error);
    throw error;
  }
}

export async function getCoinTransactionHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(coinTransactions).where(eq(coinTransactions.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get coin transaction history:", error);
    throw error;
  }
}

export async function addXP(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (!profile.length) return undefined;

    const newXP = (profile[0].xp || 0) + amount;
    const newLevel = Math.floor(newXP / 1000) + 1;

    await db.update(userProfiles).set({ xp: newXP, level: newLevel }).where(eq(userProfiles.userId, userId));

    return { xp: newXP, level: newLevel };
  } catch (error) {
    console.error("[Database] Failed to add XP:", error);
    throw error;
  }
}

export async function getAchievements() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(achievements);
  } catch (error) {
    console.error("[Database] Failed to get achievements:", error);
    throw error;
  }
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get user achievements:", error);
    throw error;
  }
}

export async function unlockAchievement(userId: number, achievementId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(userAchievements).values({ userId, achievementId });
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to unlock achievement:", error);
    throw error;
  }
}

export async function createLounge(userId: number, name: string, description: string, loungeType: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(lounges).values({
      ownerId: userId,
      name,
      description,
      loungeType,
      neonTheme: "magenta",
      memberCount: 1,
    });

    return result;
  } catch (error) {
    console.error("[Database] Failed to create lounge:", error);
    throw error;
  }
}

export async function getUserLounges(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(lounges).where(eq(lounges.ownerId, userId));
  } catch (error) {
    console.error("[Database] Failed to get user lounges:", error);
    throw error;
  }
}

export async function getLounge(loungeId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(lounges).where(eq(lounges.id, loungeId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get lounge:", error);
    throw error;
  }
}

export async function getLoungeMembersWithUsers(loungeId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const members = await db.select().from(loungeMembers).where(eq(loungeMembers.loungeId, loungeId));
    // For now, return just members - in production would join with users table
    return members;
  } catch (error) {
    console.error("[Database] Failed to get lounge members:", error);
    throw error;
  }
}

export async function addLoungeMember(loungeId: number, userId: number, role: string = "member") {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(loungeMembers).values({ loungeId, userId, role });
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to add lounge member:", error);
    throw error;
  }
}

export async function removeLoungeMember(loungeId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.delete(loungeMembers).where(and(eq(loungeMembers.loungeId, loungeId), eq(loungeMembers.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to remove lounge member:", error);
    throw error;
  }
}

export async function addLoungeMessage(loungeId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(loungeMessages).values({ loungeId, userId, content });
    return result;
  } catch (error) {
    console.error("[Database] Failed to add lounge message:", error);
    throw error;
  }
}

export async function getLoungeMessages(loungeId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(loungeMessages).where(eq(loungeMessages.loungeId, loungeId)).limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get lounge messages:", error);
    throw error;
  }
}

export async function updateLounge(loungeId: number, updates: Partial<typeof lounges.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.update(lounges).set(updates).where(eq(lounges.id, loungeId));
    const result = await db.select().from(lounges).where(eq(lounges.id, loungeId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to update lounge:", error);
    throw error;
  }
}

export async function getKidsContent() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Return sample content for now
    return [];
  } catch (error) {
    console.error("[Database] Failed to get kids content:", error);
    throw error;
  }
}

export async function trackKidsProgress(userId: number, contentId: number, progress: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(kidsProgress).values({ userId, contentId, progress });
    return result;
  } catch (error) {
    console.error("[Database] Failed to track kids progress:", error);
    throw error;
  }
}

export async function getUserKidsProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(kidsProgress).where(eq(kidsProgress.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get user kids progress:", error);
    throw error;
  }
}

// Import eq and and functions from drizzle-orm
import { eq, and } from "drizzle-orm";

export async function getPlatformSettings() {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(platformSettings).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get platform settings:", error);
    throw error;
  }
}

export async function updatePlatformSettings(updates: Partial<typeof platformSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // Get existing settings or create new ones
    const existing = await getPlatformSettings();
    
    if (existing) {
      await db.update(platformSettings).set(updates).where(eq(platformSettings.id, existing.id));
    } else {
      await db.insert(platformSettings).values(updates as any);
    }
    
    return await getPlatformSettings();
  } catch (error) {
    console.error("[Database] Failed to update platform settings:", error);
    throw error;
  }
}

export async function logAuditAction(userId: number, action: string, details: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(auditLog).values({ userId, action, details });
    return result;
  } catch (error) {
    console.error("[Database] Failed to log audit action:", error);
    throw error;
  }
}

export async function getAuditLog(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(auditLog).limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get audit log:", error);
    throw error;
  }
}

export async function getVipTiers() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(vipTiers);
  } catch (error) {
    console.error("[Database] Failed to get VIP tiers:", error);
    throw error;
  }
}

export async function getUserVipSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(userVipSubscriptions).where(eq(userVipSubscriptions.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user VIP subscription:", error);
    throw error;
  }
}

export async function createVipSubscription(userId: number, tierId: number, expiresAt: Date) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(userVipSubscriptions).values({ userId, tierId, expiresAt });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create VIP subscription:", error);
    throw error;
  }
}

export async function logVipBenefit(userId: number, benefit: string, details: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(vipBenefitsLog).values({ userId, benefit, details });
    return result;
  } catch (error) {
    console.error("[Database] Failed to log VIP benefit:", error);
    throw error;
  }
}

export async function createCollaborationProject(name: string, description: string, ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(collaborationProjects).values({ name, description, ownerId });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create collaboration project:", error);
    throw error;
  }
}

export async function getCollaborationProjects() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(collaborationProjects);
  } catch (error) {
    console.error("[Database] Failed to get collaboration projects:", error);
    throw error;
  }
}

export async function getCollaborationProject(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(collaborationProjects).where(eq(collaborationProjects.id, projectId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get collaboration project:", error);
    throw error;
  }
}

export async function addCollaborationMember(projectId: number, userId: number, role: string = "member") {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(collaborationMembers).values({ projectId, userId, role });
    return result;
  } catch (error) {
    console.error("[Database] Failed to add collaboration member:", error);
    throw error;
  }
}

export async function getCollaborationMembers(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(collaborationMembers).where(eq(collaborationMembers.projectId, projectId));
  } catch (error) {
    console.error("[Database] Failed to get collaboration members:", error);
    throw error;
  }
}

export async function addCollaborationTask(projectId: number, title: string, description: string, assignedTo: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(collaborationTasks).values({ projectId, title, description, assignedTo });
    return result;
  } catch (error) {
    console.error("[Database] Failed to add collaboration task:", error);
    throw error;
  }
}

export async function getCollaborationTasks(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(collaborationTasks).where(eq(collaborationTasks.projectId, projectId));
  } catch (error) {
    console.error("[Database] Failed to get collaboration tasks:", error);
    throw error;
  }
}

export async function updateCollaborationTask(taskId: number, updates: Partial<typeof collaborationTasks.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.update(collaborationTasks).set(updates).where(eq(collaborationTasks.id, taskId));
    const result = await db.select().from(collaborationTasks).where(eq(collaborationTasks.id, taskId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to update collaboration task:", error);
    throw error;
  }
}

export async function addCollaborationUpdate(projectId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(collaborationUpdates).values({ projectId, userId, content });
    return result;
  } catch (error) {
    console.error("[Database] Failed to add collaboration update:", error);
    throw error;
  }
}

export async function getCollaborationUpdates(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(collaborationUpdates).where(eq(collaborationUpdates.projectId, projectId));
  } catch (error) {
    console.error("[Database] Failed to get collaboration updates:", error);
    throw error;
  }
}


export async function updateMerchRequestStatus(requestId: number, status: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // Assuming there's a merch_requests table
    // For now, return success
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update merch request status:", error);
    throw error;
  }
}

export async function getAdminAnalytics() {
  const db = await getDb();
  if (!db) return {};

  try {
    // Return mock analytics for now
    return {
      totalUsers: 1,
      activeUsers: 1,
      totalCoins: "0",
      totalTransactions: 0,
      totalAchievements: 0,
    };
  } catch (error) {
    console.error("[Database] Failed to get admin analytics:", error);
    throw error;
  }
}


export async function getAllMerchRequests() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Return empty array for now - merch requests table may not exist
    return [];
  } catch (error) {
    console.error("[Database] Failed to get all merch requests:", error);
    throw error;
  }
}
