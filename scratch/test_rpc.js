const { createClient } = require("@supabase/supabase-js");

const url = "https://bgwqaycjwfpnioffluvs.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnd3FheWNqd2ZwbmlvZmZsdXZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0NTcxNiwiZXhwIjoyMDg4ODIxNzE2fQ.OYNrcXM-Eu90q53I4BxfMKkTFU7bxf7shhCXJibSADU";

const supabase = createClient(url, key);

async function main() {
  console.log("Testing exec_sql RPC...");
  try {
    const { data, error } = await supabase.rpc("exec_sql", { query: "SELECT 1" });
    console.log("Result for exec_sql:", data, error);
  } catch (err) {
    console.log("exec_sql failed:", err.message);
  }

  console.log("Testing execute_sql RPC...");
  try {
    const { data, error } = await supabase.rpc("execute_sql", { query: "SELECT 1" });
    console.log("Result for execute_sql:", data, error);
  } catch (err) {
    console.log("execute_sql failed:", err.message);
  }
}

main();
