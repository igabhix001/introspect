import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface ReverseRequestBody {
  mistake_key: string;
  reversal_comment: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit
  const identifier = getRateLimitIdentifier(request);
  const rateLimitResult = await apiRateLimit(identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: tradeId } = await params;
    if (!tradeId) {
      return NextResponse.json({ error: "Trade ID is required" }, { status: 400 });
    }

    let body: ReverseRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { mistake_key, reversal_comment } = body;

    // Validate inputs
    if (!mistake_key || typeof mistake_key !== "string" || mistake_key.trim() === "") {
      return NextResponse.json({ error: "mistake_key is required" }, { status: 400 });
    }
    if (!reversal_comment || typeof reversal_comment !== "string" || reversal_comment.trim().length < 5) {
      return NextResponse.json(
        { error: "A comment explaining why this is not a mistake is required (minimum 5 characters)" },
        { status: 400 }
      );
    }
    if (reversal_comment.trim().length > 500) {
      return NextResponse.json({ error: "Comment must be 500 characters or less" }, { status: 400 });
    }

    // Verify the trade belongs to this user and the mistake_key exists in it
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .select("id, user_id, mistakes")
      .eq("id", tradeId)
      .eq("user_id", user.id)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: "Trade not found or access denied" }, { status: 404 });
    }

    const tradeMistakes: string[] = Array.isArray(trade.mistakes) ? trade.mistakes : [];
    if (!tradeMistakes.includes(mistake_key)) {
      return NextResponse.json(
        { error: `Mistake '${mistake_key}' does not exist on this trade` },
        { status: 422 }
      );
    }

    // Check for duplicate reversal (idempotent — prevent duplicate submissions)
    const { data: existingReversal } = await supabase
      .from("trade_mistake_reversals")
      .select("id")
      .eq("trade_id", tradeId)
      .eq("user_id", user.id)
      .eq("mistake_key", mistake_key)
      .maybeSingle();

    if (existingReversal) {
      return NextResponse.json(
        { error: "You have already submitted a reversal for this mistake" },
        { status: 409 }
      );
    }

    // Insert reversal record
    const { data: reversal, error: insertError } = await supabase
      .from("trade_mistake_reversals")
      .insert({
        trade_id: tradeId,
        user_id: user.id,
        mistake_key: mistake_key.trim(),
        reversal_comment: reversal_comment.trim(),
      })
      .select()
      .single();

    if (insertError) {
      // If table doesn't exist yet (migration not run), give a clear error
      if (insertError.code === "42P01") {
        return NextResponse.json(
          { error: "Mistake review feature requires a database migration. Please contact support." },
          { status: 503 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      reversal: {
        id: reversal.id,
        trade_id: reversal.trade_id,
        mistake_key: reversal.mistake_key,
        reversal_comment: reversal.reversal_comment,
        created_at: reversal.created_at,
      },
    });
  } catch (error) {
    console.error("Reverse mistake error:", error);
    return NextResponse.json({ error: "Failed to submit reversal" }, { status: 500 });
  }
}
