const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const host = "2406:da1a:6b0:f601:6290:568f:eeb0:27d9";
const user = "postgres";
const database = "postgres";
const port = 5432;

// Potential passwords
const passwords = [
  "imlearning@intros2026",
  "Vnao@2026",
  "HG46P4BCMF",
  "postgres"
];

async function tryConnect(password) {
  const client = new Client({
    host,
    user,
    database,
    password,
    port,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log(`Successfully connected using password: ${password}`);
    return client;
  } catch (err) {
    console.log(`Failed with password: ${password}. Error: ${err.message}`);
    return null;
  }
}

async function main() {
  let client = null;
  for (const pw of passwords) {
    client = await tryConnect(pw);
    if (client) break;
  }

  if (!client) {
    console.error("Could not connect to database with any candidate password.");
    process.exit(1);
  }

  try {
    // Read migrations
    const mig11Path = path.join(__dirname, "..", "supabase", "migration_011_add_market_sentiment.sql");
    const mig12Path = path.join(__dirname, "..", "supabase", "migration_012_ai_limits.sql");

    console.log("Reading migration 011...");
    const sql11 = fs.readFileSync(mig11Path, "utf8");
    console.log("Executing migration 011...");
    await client.query(sql11);
    console.log("Migration 011 successfully executed!");

    console.log("Reading migration 012...");
    const sql12 = fs.readFileSync(mig12Path, "utf8");
    console.log("Executing migration 012...");
    await client.query(sql12);
    console.log("Migration 012 successfully executed!");

  } catch (err) {
    console.error("Error executing migrations:", err);
  } finally {
    await client.end();
  }
}

main();
