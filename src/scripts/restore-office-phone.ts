import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.");
  process.exit(1);
}

async function restoreOfficePhone() {
  const backupFilePath = path.join(process.cwd(), "db", "backups", "consumer_transformers_backup.json");
  if (!fs.existsSync(backupFilePath)) {
    console.error(`Backup file not found at ${backupFilePath}`);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFilePath, "utf8")) as Array<{
    consumer_no: string;
    office_phone: string | null;
  }>;

  console.log(`Starting restore of office_phone for ${backupData.length} records...`);

  let successCount = 0;
  for (const record of backupData) {
    if (!record.office_phone) {
      console.log(`Skipping consumer ${record.consumer_no} - no office_phone in backup.`);
      continue;
    }

    const url = `${SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/consumer_transformers?consumer_no=eq.${encodeURIComponent(record.consumer_no)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        office_phone: record.office_phone,
      }),
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      console.error(`Failed to restore consumer ${record.consumer_no}: ${res.statusText} (${res.status}) - ${errorMsg}`);
    } else {
      successCount++;
      if (successCount % 5 === 0 || successCount === backupData.length) {
        console.log(`Restored ${successCount}/${backupData.length} records...`);
      }
    }
  }

  console.log(`Successfully restored ${successCount} office phone numbers.`);
}

restoreOfficePhone();
