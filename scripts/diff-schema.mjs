import { getDb } from "../server/db.ts";
import * as schema from "../drizzle/schema.ts";
import { getTableConfig } from "drizzle-orm/mysql-core";

async function run() {
  const db = await getDb();
  if (!db) {
    console.log("Database not available");
    return;
  }

  console.log("=== TWO-SIDED DRIZZLE VS MARIADB SCHEMA DIFF ===");

  const drizzleTables = {};
  for (const [key, value] of Object.entries(schema)) {
    if (value && typeof value === "object") {
      try {
        const config = getTableConfig(value);
        if (config && config.name) {
          drizzleTables[config.name] = config.columns.map(c => c.name);
        }
      } catch (e) {
        // Ignore non-table exports
      }
    }
  }

  const [tablesResult] = await db.execute("SHOW TABLES");
  const liveTables = {};
  for (const t of tablesResult) {
    const tableName = Object.values(t)[0];
    const [colsResult] = await db.execute(`SHOW COLUMNS FROM \`${tableName}\``);
    liveTables[tableName] = colsResult.map(c => c.Field);
  }

  const allTableNames = Array.from(new Set([...Object.keys(drizzleTables), ...Object.keys(liveTables)])).sort();

  for (const tableName of allTableNames) {
    console.log(`\nTable: ${tableName}`);
    const drizzleCols = drizzleTables[tableName];
    const liveCols = liveTables[tableName];

    if (!drizzleCols) {
      console.log(`  [EXTRA IN DB] Table exists in DB but not in Drizzle schema.`);
      continue;
    }
    if (!liveCols) {
      console.log(`  [MISSING IN DB] Table exists in Drizzle schema but not in DB.`);
      continue;
    }

    const missingInDb = drizzleCols.filter(c => !liveCols.includes(c));
    const extraInDb = liveCols.filter(c => !drizzleCols.includes(c));

    if (missingInDb.length > 0) {
      console.log(`  Columns in Drizzle but MISSING in DB:`, missingInDb);
    }
    if (extraInDb.length > 0) {
      console.log(`  Columns in DB but not in Drizzle:`, extraInDb);
    }
    if (missingInDb.length === 0 && extraInDb.length === 0) {
      console.log(`  ✓ Schema in sync.`);
    }
  }
}

run().catch(console.error);
