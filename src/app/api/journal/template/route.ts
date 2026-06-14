import { NextResponse } from "next/server";

export async function GET() {
  const headers = [
    "Symbol", "Trade Type", "Quantity", "Price", "Execution Time"
  ];
  
  const sampleRows = [
    ["INDRAMEDCO", "BUY", "35", "537.65", "2025-10-07 10:51:16"],
    ["INDRAMEDCO", "SELL", "35", "539.30", "2025-10-07 10:52:05"],
    ["DIVISLAB", "BUY", "3", "5931.00", "2025-10-07 10:57:15"],
    ["DIVISLAB", "SELL", "3", "5949.00", "2025-10-07 10:57:33"]
  ];

  const csv = [
    headers.join(","),
    ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="introspect_journal_template.csv"',
    },
  });
}
