import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.");
  process.exit(1);
}

function hashMobile(mobile: string) {
  const normalized = mobile.replace(/\D/g, "").slice(-10);
  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex");
}

async function fetchConsumers() {
  const url = `${SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/consumer_transformers?select=consumer_no,mobile`;
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
    throw new Error(`Failed to fetch consumer_transformers: ${res.statusText} (${res.status}) - ${errorMsg}`);
  }

  return res.json() as Promise<Array<{ consumer_no: string; mobile: string | null }>>;
}

async function updateConsumerHash(consumerNo: string, mobileHash: string) {
  const url = `${SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/consumer_transformers?consumer_no=eq.${encodeURIComponent(consumerNo)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      mobile_hash: mobileHash,
    }),
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(`Failed to update consumer ${consumerNo}: ${res.statusText} (${res.status}) - ${errorMsg}`);
  }
}

async function run() {
  console.log("Starting data migration: Mobile Hash Migration...");

  try {
    const consumers = await fetchConsumers();
    console.log(`Found ${consumers.length} consumers to process.`);

    let successCount = 0;
    for (const consumer of consumers) {
      if (!consumer.mobile) {
        console.log(`Skipping consumer ${consumer.consumer_no} - no mobile number stored.`);
        continue;
      }

      const mobileHash = hashMobile(consumer.mobile);
      await updateConsumerHash(consumer.consumer_no, mobileHash);
      successCount++;
      
      if (successCount % 5 === 0 || successCount === consumers.length) {
        console.log(`Processed ${successCount}/${consumers.length} records...`);
      }
    }

    console.log(`Successfully migrated ${successCount} mobile numbers to hashes.`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
