import { getDb } from "../server/db.ts";

async function run() {
  const db = await getDb();
  if (!db) {
    console.log("Database not available");
    return;
  }
  const [tablesResult] = await db.execute("SHOW TABLES");
  const tables = tablesResult;
  console.log("=== LIVE DATABASE SCHEMA DIFF ===");
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [colsResult] = await db.execute(`SHOW COLUMNS FROM \`${tableName}\``);
    console.log(`Table: ${tableName}`);
    for (const col of colsResult) {
      console.log(`  - ${col.Field} (${col.Type}) [Null: ${col.Null}, Default: ${col.Default}]`);
    }
  }
}

run().catch(console.error);
