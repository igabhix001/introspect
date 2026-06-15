const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "../.env" });

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("trades")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Error connecting to Supabase:", error);
    return;
  }

  console.log("Connected successfully. Checking column 'observations'...");
  const { data: cols, error: colError } = await supabase
    .from("trades")
    .select("observations")
    .limit(1);

  if (colError) {
    console.log("Column 'observations' does not exist:", colError.message);
  } else {
    console.log("Column 'observations' exists!");
  }
}

check();
