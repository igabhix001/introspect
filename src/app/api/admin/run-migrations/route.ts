import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import fs from "fs";
import path from "path";

// Verify the user is the admin before allowing them to run migrations
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.email === "intradaymindview@gmail.com") return user;
  
  try {
    // Check role in database
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") return user;
  } catch {
    // Fallback
  }
  return null;
}

export async function POST(request: NextRequest) {
  return handleMigrationRequest(request);
}

export async function GET(request: NextRequest) {
  return handleMigrationRequest(request);
}

async function handleMigrationRequest(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Verify Admin Authentication (Session-based or Secret-based)
    const secretParam = request.nextUrl.searchParams.get("secret");
    const secretHeader = request.headers.get("x-migration-secret");
    const isSecretValid = (secretParam === process.env.CRON_SECRET) || (secretHeader === process.env.CRON_SECRET);

    if (!isSecretValid) {
      const admin = await verifyAdmin(supabase);
      if (!admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Try to find the Postgres connection string in the environment
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      return NextResponse.json({ 
        error: "Missing database connection string", 
        message: "Please configure DATABASE_URL or POSTGRES_URL in the environment." 
      }, { status: 400 });
    }

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log("Connected to database for migration run.");

    const results: string[] = [];

    // Path to migration files
    const migrationsDir = path.join(process.cwd(), "supabase");
    const mig11Path = path.join(migrationsDir, "migration_011_add_market_sentiment.sql");
    const mig12Path = path.join(migrationsDir, "migration_012_ai_limits.sql");

    // Execute migration 011 if it exists
    if (fs.existsSync(mig11Path)) {
      console.log("Applying migration 011...");
      const sql = fs.readFileSync(mig11Path, "utf8");
      await client.query(sql);
      results.push("migration_011_add_market_sentiment.sql successfully applied.");
    } else {
      results.push("migration_011_add_market_sentiment.sql not found.");
    }

    // Execute migration 012 if it exists
    if (fs.existsSync(mig12Path)) {
      console.log("Applying migration 012...");
      const sql = fs.readFileSync(mig12Path, "utf8");
      await client.query(sql);
      results.push("migration_012_ai_limits.sql successfully applied.");
    } else {
      results.push("migration_012_ai_limits.sql not found.");
    }

    await client.end();

    return NextResponse.json({ 
      success: true, 
      message: "Migrations completed successfully.",
      details: results 
    });
  } catch (error: any) {
    console.error("Migration execution error:", error);
    return NextResponse.json({ 
      error: "Migration failed", 
      message: error.message || "Unknown database error" 
    }, { status: 500 });
  }
}
