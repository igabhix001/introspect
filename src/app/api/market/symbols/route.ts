import { NextRequest, NextResponse } from "next/server";
import { FYERS_SYMBOLS_MASTER } from "@/lib/fyers/symbols";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category") || "all";

    // Start with local master symbols filtering
    let localFiltered = FYERS_SYMBOLS_MASTER;
    if (category !== "all") {
      localFiltered = localFiltered.filter(item => item.type === category);
    }
    if (query) {
      const qLower = query.toLowerCase();
      localFiltered = localFiltered.filter(
        item => item.symbol.toLowerCase().includes(qLower) || 
                item.description.toLowerCase().includes(qLower)
      );
    }

    // If query is empty, return top 15 local symbols
    if (!query) {
      return NextResponse.json({ symbols: localFiltered.slice(0, 15) });
    }

    // Query Yahoo Finance Search API for Indian symbols
    const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0`;
    
    let yahooSymbols: any[] = [];
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500); // 1.5s timeout for safety

      const res = await fetch(yahooUrl, { 
        cache: "no-store",
        signal: controller.signal 
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.quotes)) {
          yahooSymbols = data.quotes
            .filter((q: any) => 
              q.symbol && 
              (q.quoteType === "EQUITY" || q.quoteType === "ETF" || q.quoteType === "INDEX") &&
              (q.symbol.endsWith(".NS") || q.symbol.endsWith(".BO") || q.symbol === "^NSEI" || q.symbol === "^NSEBANK")
            )
            .map((q: any) => {
              const sym = q.symbol;
              let symbol = sym;
              let exchange: "NSE" | "BSE" = "NSE";
              let type: "stocks" | "etfs" | "indices" | "options" | "futures" = "stocks";

              if (sym.endsWith(".NS")) {
                const ticker = sym.slice(0, -3);
                symbol = `NSE:${ticker}-EQ`;
                exchange = "NSE";
                type = q.quoteType === "ETF" ? "etfs" : "stocks";
              } else if (sym.endsWith(".BO")) {
                const ticker = sym.slice(0, -3);
                symbol = `BSE:${ticker}-EQ`;
                exchange = "BSE";
                type = "stocks";
              } else if (sym === "^NSEI") {
                symbol = "NSE:NIFTY50-INDEX";
                exchange = "NSE";
                type = "indices";
              } else if (sym === "^NSEBANK") {
                symbol = "NSE:NIFTYBANK-INDEX";
                exchange = "NSE";
                type = "indices";
              }

              return {
                symbol,
                description: q.shortname || q.longname || q.symbol,
                type,
                exchange
              };
            });
        }
      }
    } catch (err) {
      console.warn("Yahoo Finance search failed, falling back to local:", err);
    }

    // Combine local results and yahoo results
    const combined = [...localFiltered];
    
    // Append yahoo results if they are not already in local list
    for (const item of yahooSymbols) {
      if (category !== "all" && item.type !== category) {
        continue;
      }
      const exists = combined.some(c => c.symbol.toUpperCase() === item.symbol.toUpperCase());
      if (!exists) {
        combined.push(item);
      }
    }

    return NextResponse.json({ symbols: combined.slice(0, 30) });
  } catch (error: any) {
    console.error("Symbol search error:", error);
    return NextResponse.json({ error: "Failed to search symbols" }, { status: 500 });
  }
}
