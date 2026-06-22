import { hashMobile } from "../features/transformer/transformer-cache";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function test() {
  console.log("Starting end-to-end privacy validation tests...");

  // We will use one of the migrated records: consumer "1145665010696", mobile "9387942784"
  const testConsumer = "1145665010696";
  const testMobile = "9387942784";
  const wrongMobile = "9999999999";

  try {
    // 1. Test Cache Hit with correct credentials
    console.log("\n1. Testing Cache Hit with correct credentials...");
    const res1 = await fetch(`${BASE_URL}/api/consumer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumerNumber: testConsumer, mobile: testMobile }),
    });

    if (!res1.ok) {
      throw new Error(`Cache hit request failed: ${res1.statusText} (${res1.status})`);
    }
    const data1 = await res1.json();
    console.log("Response data:", JSON.stringify(data1, null, 2));
    if (!data1.success || data1.data?.consumerNumber !== testConsumer) {
      throw new Error("Validation failed: expected success and matching consumerNumber.");
    }
    console.log("✓ Cache Hit test passed!");

    // 2. Test Cache Miss / Mismatch with wrong mobile number
    console.log("\n2. Testing Cache Miss with wrong mobile number...");
    const res2 = await fetch(`${BASE_URL}/api/consumer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumerNumber: testConsumer, mobile: wrongMobile }),
    });

    console.log(`Response status: ${res2.status}`);
    const data2 = await res2.json();
    console.log("Response data:", JSON.stringify(data2, null, 2));
    if (data2.success || data2.stage !== "cache-miss") {
      throw new Error("Validation failed: expected cache-miss response.");
    }
    console.log("✓ Cache Miss / mismatch test passed!");

    // 3. Test Deletion Endpoint
    console.log("\n3. Testing instant deletion endpoint...");
    const res3 = await fetch(`${BASE_URL}/api/privacy/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumerNumber: testConsumer, mobileNumber: testMobile }),
    });

    if (!res3.ok) {
      throw new Error(`Deletion request failed: ${res3.statusText} (${res3.status})`);
    }
    const data3 = await res3.json();
    console.log("Response data:", JSON.stringify(data3, null, 2));
    if (!data3.success) {
      throw new Error("Validation failed: deletion was not successful.");
    }
    console.log("✓ Deletion request accepted!");

    // 4. Verify that lookup now results in a cache miss
    console.log("\n4. Verifying record was deleted (should result in cache-miss)...");
    const res4 = await fetch(`${BASE_URL}/api/consumer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumerNumber: testConsumer, mobile: testMobile }),
    });

    const data4 = await res4.json();
    console.log("Response data:", JSON.stringify(data4, null, 2));
    if (data4.success || data4.stage !== "cache-miss") {
      throw new Error("Validation failed: expected cache-miss after deletion.");
    }
    console.log("✓ Verification of deletion passed!");

    console.log("\nAll end-to-end privacy validation tests passed successfully!");
  } catch (error) {
    console.error("\nE2E Validation Failed:", error);
    process.exit(1);
  }
}

test();
