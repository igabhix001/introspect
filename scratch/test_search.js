async function test() {
  const query = "TATA";
  const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0`;
  
  console.log("Fetching symbols for:", query);
  const res = await fetch(yahooUrl);
  const data = await res.json();
  
  const filtered = data.quotes
    .filter((q) => q.symbol && 
                  (q.quoteType === "EQUITY" || q.quoteType === "ETF" || q.quoteType === "INDEX") &&
                  (q.symbol.endsWith(".NS") || q.symbol.endsWith(".BO") || q.symbol === "^NSEI" || q.symbol === "^NSEBANK")
    )
    .map((q) => {
      const sym = q.symbol;
      let symbol = sym;
      let exchange = "NSE";
      if (sym.endsWith(".NS")) {
        symbol = `NSE:${sym.slice(0, -3)}-EQ`;
        exchange = "NSE";
      } else if (sym.endsWith(".BO")) {
        symbol = `BSE:${sym.slice(0, -3)}-EQ`;
        exchange = "BSE";
      }
      return {
        symbol,
        description: q.shortname || q.symbol,
        exchange,
        quoteType: q.quoteType
      };
    });

  console.log("Filtered mapped Fyers symbols:");
  console.log(filtered);
}

test();
