import { getDb } from "../server/db.ts";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  console.log("Applying schema migrations...");
  try {
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS logo_url TEXT`);
    console.log("✓ Added logo_url to platform_settings");
  } catch (e) {
    console.error("Error adding logo_url:", e);
  }

  try {
    await db.execute(sql`ALTER TABLE guardian_links ADD COLUMN IF NOT EXISTS relationship_type ENUM('parent', 'legal_guardian', 'other') DEFAULT 'parent' NOT NULL`);
    await db.execute(sql`ALTER TABLE guardian_links ADD COLUMN IF NOT EXISTS dashboard_opt_out BOOLEAN DEFAULT false NOT NULL`);
    console.log("✓ Added relationship_type and dashboard_opt_out to guardian_links");
  } catch (e) {
    console.error("Error adding guardian_links columns:", e);
  }

  console.log("Migrations applied successfully.");
}

run().catch(console.error);
