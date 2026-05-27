const { createClient } = require("@supabase/supabase-js");

const url = "https://bgwqaycjwfpnioffluvs.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnd3FheWNqd2ZwbmlvZmZsdXZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0NTcxNiwiZXhwIjoyMDg4ODIxNzE2fQ.OYNrcXM-Eu90q53I4BxfMKkTFU7bxf7shhCXJibSADU";

const supabase = createClient(url, key);

async function main() {
  console.log("Checking subscriptions...");
  const { data: subData, error: subError } = await supabase.from("subscriptions").select("*");
  if (subError) {
    console.error("Query subscriptions error:", subError);
  } else {
    console.log("Subscriptions:", subData);
  }

  console.log("Checking daily reports...");
  const { data: reportData, error: reportError } = await supabase.from("daily_reports").select("*");
  if (reportError) {
    console.error("Query daily_reports error:", reportError);
  } else {
    console.log("Daily Reports:", JSON.stringify(reportData, null, 2));
  }
}

main();
