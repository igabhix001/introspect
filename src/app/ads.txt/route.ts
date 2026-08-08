import { NextResponse } from "next/server";

export async function GET() {
  const envPubId = (process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "").trim();
  const digitsOnly = envPubId.replace(/[^0-9]/g, "");
  const pubId = digitsOnly ? `pub-${digitsOnly}` : "pub-0000000000000000";

  const content = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
