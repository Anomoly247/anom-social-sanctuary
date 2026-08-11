import { getDb } from "./db";
import { FEATURE_REGISTRY } from "./featureFlags";
import { sql } from "drizzle-orm";

async function seedFlags() {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS feature_flags JSON`);
  } catch (e) {}

  const flags: Record<string, boolean> = {};
  for (const [k, c] of Object.entries(FEATURE_REGISTRY)) {
    flags[k] = c.default === "on";
  }
  flags.lounge_image_upload = false;
  flags.vip_custom_emoji = false;

  const [existing] = await db.execute(sql`SELECT id FROM platform_settings LIMIT 1`) as any;
  if (!existing || existing.length === 0) {
    await db.execute(sql`INSERT INTO platform_settings (site_name, feature_flags) VALUES ('Anom Artsy', ${JSON.stringify(flags)})`);
  } else {
    const id = existing[0]?.id || 1;
    await db.execute(sql`UPDATE platform_settings SET feature_flags = ${JSON.stringify(flags)} WHERE id = ${id}`);
  }
  console.log("[Seed] Persisted feature flags to DB via raw SQL with lounge_image_upload and vip_custom_emoji explicitly OFF.");
}

seedFlags().catch(console.error);
