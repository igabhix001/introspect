const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const userId = '502b5fae-bf6b-4293-bf3a-a756aa46debf'; // Abhi (admin)
// Let's also test a regular user to be sure
const userIdUser = '5f50dd22-3b93-4ac9-83b6-122fece4afb9'; // abhisuri26@gmail.com (user)

async function testQueryForUser(uid, label) {
  console.log(`\n--- Testing queries for ${label} (${uid}) ---`);
  const today = new Date().toISOString().split("T")[0];

  const queries = [
    {
      name: "trades (today)",
      promise: supabase
        .from("trades")
        .select("*")
        .eq("user_id", uid)
        .gte("created_at", `${today}T00:00:00`)
        .order("created_at", { ascending: false })
    },
    {
      name: "assessments (latest)",
      promise: supabase
        .from("assessments")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    },
    {
      name: "daily_reports (35 days)",
      promise: supabase
        .from("daily_reports")
        .select("date, discipline_score")
        .eq("user_id", uid)
        .order("date", { ascending: false })
        .limit(35)
    },
    {
      name: "challenges (active)",
      promise: supabase
        .from("challenges")
        .select("*")
        .eq("user_id", uid)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    },
    {
      name: "daily_reports (today)",
      promise: supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", uid)
        .eq("date", today)
        .maybeSingle()
    },
    {
      name: "trades (all pnl)",
      promise: supabase
        .from("trades")
        .select("pnl, exit_price")
        .eq("user_id", uid)
    }
  ];

  for (const q of queries) {
    const start = Date.now();
    try {
      const { data, error } = await q.promise;
      const duration = Date.now() - start;
      if (error) {
        console.error(`❌ Query "${q.name}" failed in ${duration}ms:`, error);
      } else {
        console.log(`✅ Query "${q.name}" succeeded in ${duration}ms. Rows: ${Array.isArray(data) ? data.length : (data ? 1 : 0)}`);
      }
    } catch (err) {
      console.error(`❌ Query "${q.name}" threw error in ${Date.now() - start}ms:`, err);
    }
  }
}

async function run() {
  await testQueryForUser(userId, 'Admin User');
  await testQueryForUser(userIdUser, 'Regular User');
}

run();
