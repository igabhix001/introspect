const { Client } = require("pg");

const host = "aws-0-ap-south-1.pooler.supabase.com";
const user = "postgres.bgwqaycjwfpnioffluvs";
const database = "postgres";
const port = 6543;
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
  for (const pw of passwords) {
    const client = await tryConnect(pw);
    if (client) {
      await client.end();
      break;
    }
  }
}

main();
