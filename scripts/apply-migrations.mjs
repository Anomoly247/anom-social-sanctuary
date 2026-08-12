import { getDb } from "../server/db.ts";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  console.log("Applying combined schema migration for all missing columns...");
  try {
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT`);
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS enable_lounges BOOLEAN DEFAULT true NOT NULL`);
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS enable_games BOOLEAN DEFAULT true NOT NULL`);
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS enable_kids_corner BOOLEAN DEFAULT true NOT NULL`);
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS stripe_public_key TEXT`);
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT`);
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL`);
    console.log("✓ Updated platform_settings columns");
  } catch (e) {
    console.error("Error updating platform_settings:", e);
  }

  try {
    await db.execute(sql`ALTER TABLE kids_progress ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false NOT NULL`);
    await db.execute(sql`ALTER TABLE kids_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL`);
    console.log("✓ Updated kids_progress columns");
  } catch (e) {
    console.error("Error updating kids_progress:", e);
  }

  console.log("Combined migration applied successfully.");
}

run().catch(console.error);
