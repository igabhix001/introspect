import { NextResponse } from "next/server";

export async function GET() {
  const headers = [
    "Date", "Symbol", "Direction", "Entry Price", "Exit Price", 
    "Quantity", "Stop Loss", "Target Price", "Followed Plan", "Emotion", 
    "Notes", "Market Sentiment", "Entry Time", "Exit Time"
  ];
  
  const sampleRow = [
    "2026-05-27", "NIFTY 50", "long", "22450.00", "22550.00", 
    "75", "22400.00", "22600.00", "Yes", "Calm", 
    "Sample trade notes explaining logic", "Bullish", "09:30", "15:15"
  ];

  const csv = [
    headers.join(","),
    sampleRow.map(cell => `"${cell}"`).join(",")
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="introspect_journal_template.csv"',
    },
  });
}
