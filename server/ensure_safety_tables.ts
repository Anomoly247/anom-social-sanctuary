import { getDb } from "./db";
import { sql } from "drizzle-orm";

export async function ensureSafetyTables() {
  console.log("[Migration] Initializing safety layer database migration...");
  const db = await getDb();
  if (!db) {
    console.error("[Migration] Database not available");
    process.exit(1);
  }

  try {
    // Ensure feed_posts exists
    await db.execute(sql`CREATE TABLE IF NOT EXISTS feed_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      post_type VARCHAR(50) NOT NULL,
      title VARCHAR(100),
      content TEXT,
      image_url TEXT,
      likes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`);

    // Ensure lounge_messages exists
    await db.execute(sql`CREATE TABLE IF NOT EXISTS lounge_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lounge_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      is_pinned BOOLEAN DEFAULT false NOT NULL,
      reactions JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);

    // Alter users table
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS moderator_tier VARCHAR(20) DEFAULT 'none'`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS age_bracket ENUM('under_13', 'teen_13_17', 'adult_18_plus', 'unverified') DEFAULT 'unverified' NOT NULL`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS restricted_until TIMESTAMP`);

    // Alter lounge_messages and feed_posts for soft deletes and moderation status
    await db.execute(sql`ALTER TABLE lounge_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE lounge_messages ADD COLUMN IF NOT EXISTS deleted_by_user_id INT`);
    await db.execute(sql`ALTER TABLE lounge_messages ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'visible' NOT NULL`);

    await db.execute(sql`ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS deleted_by_user_id INT`);
    await db.execute(sql`ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'visible' NOT NULL`);

    // Create reports table
    await db.execute(sql`CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reporter_user_id INT NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id INT NOT NULL,
      reason VARCHAR(50) NOT NULL,
      details TEXT,
      status VARCHAR(30) DEFAULT 'open' NOT NULL,
      assigned_to_user_id INT,
      resolution_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`);

    // Create user_blocks table
    await db.execute(sql`CREATE TABLE IF NOT EXISTS user_blocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      blocker_user_id INT NOT NULL,
      blocked_user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);

    // Create moderation_actions table
    await db.execute(sql`CREATE TABLE IF NOT EXISTS moderation_actions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      moderator_user_id INT NOT NULL,
      target_user_id INT,
      target_type VARCHAR(50),
      target_id INT,
      action_type VARCHAR(50) NOT NULL,
      report_id INT,
      reason TEXT NOT NULL,
      expires_at TIMESTAMP,
      reversed_at TIMESTAMP,
      reversed_by_user_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);

    // Create guardian_links table
    await db.execute(sql`CREATE TABLE IF NOT EXISTS guardian_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guardian_user_id INT NOT NULL,
      child_user_id INT NOT NULL,
      consent_status VARCHAR(30) DEFAULT 'pending' NOT NULL,
      consent_method VARCHAR(64),
      consent_granted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`);

    // Alter kids_progress
    await db.execute(sql`ALTER TABLE kids_progress ADD COLUMN IF NOT EXISTS guardian_link_id INT`);

    console.log("[Migration] ✓ Safety layer migration applied successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[Migration] Failed to apply safety migration:", error);
    process.exit(1);
  }
}

ensureSafetyTables().catch(console.error);
