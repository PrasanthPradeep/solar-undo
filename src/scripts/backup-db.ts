import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.");
  process.exit(1);
}

async function fetchTable(tableName: string) {
  const url = `${SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/${tableName}?select=*`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(`Failed to fetch ${tableName}: ${res.statusText} (${res.status}) - ${errorMsg}`);
  }

  return res.json();
}

async function backup() {
  const tables = ["transformers", "consumer_transformers", "transformer_history"];
  const backupDir = path.join(process.cwd(), "db", "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Starting database backup to ${backupDir}...`);

  for (const table of tables) {
    try {
      console.log(`Backing up table: ${table}...`);
      const data = await fetchTable(table);
      const filePath = path.join(backupDir, `${table}_backup.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      console.log(`Successfully backed up ${table} (${(data as any[]).length} rows) to ${filePath}`);
    } catch (error) {
      console.error(`Failed to back up ${table}:`, error);
      process.exit(1);
    }
  }

  console.log("Database backup completed successfully.");
}

backup();
