const { Client } = require("pg");

const regions = [
  "ap-south-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-southeast-2",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "eu-west-2",
  "eu-west-3",
  "ca-central-1",
  "sa-east-1"
];

const user = "postgres.bgwqaycjwfpnioffluvs";
const database = "postgres";
const port = 6543;
const password = "dummy-password";

async function probeRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new Client({
    host,
    user,
    database,
    password,
    port,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });

  try {
    await client.connect();
    // This shouldn't succeed with a dummy password, but if it does, it's our region!
    console.log(`Region ${region}: Connected!`);
    await client.end();
    return true;
  } catch (err) {
    const msg = err.message;
    if (msg.includes("password authentication failed")) {
      console.log(`Region ${region}: FOUND (auth failed as expected)`);
      return true;
    } else {
      console.log(`Region ${region}: NOT FOUND (${msg.substring(0, 100)})`);
      return false;
    }
  }
}

async function main() {
  console.log("Probing regions for tenant bgwqaycjwfpnioffluvs...");
  for (const r of regions) {
    const found = await probeRegion(r);
    if (found) {
      console.log(`\nFound target region: ${r}`);
      break;
    }
  }
}

main();
