export interface FyersSymbolInfo {
  symbol: string;
  description: string;
  type: "stocks" | "futures" | "options" | "etfs" | "indices";
  exchange: "NSE" | "BSE" | "MCX";
}

export const FYERS_SYMBOLS_MASTER: FyersSymbolInfo[] = [
  // Indices
  { symbol: "NSE:NIFTY50-INDEX", description: "NIFTY 50 INDEX", type: "indices", exchange: "NSE" },
  { symbol: "NSE:NIFTYBANK-INDEX", description: "NIFTY BANK INDEX", type: "indices", exchange: "NSE" },
  { symbol: "NSE:NIFTYFINSERVICE-INDEX", description: "NIFTY FINANCIAL SERVICES INDEX (FINNIFTY)", type: "indices", exchange: "NSE" },
  { symbol: "NSE:MIDCPNIFTY-INDEX", description: "NIFTY MIDCAP SELECT INDEX", type: "indices", exchange: "NSE" },
  { symbol: "NSE:NIFTYNEXT50-INDEX", description: "NIFTY NEXT 50 INDEX", type: "indices", exchange: "NSE" },
  { symbol: "NSE:INDIA_VIX-INDEX", description: "INDIA VIX", type: "indices", exchange: "NSE" },

  // Stocks (TATA Group - match search screenshot)
  { symbol: "NSE:TATASTEEL-EQ", description: "TATA STEEL LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "BSE:TATASTEEL-A", description: "TATA STEEL LTD.", type: "stocks", exchange: "BSE" },
  { symbol: "NSE:TCS-EQ", description: "TATA CONSULTANCY SERV LT", type: "stocks", exchange: "NSE" },
  { symbol: "BSE:TCS-A", description: "TATA CONSULTANCY SERVICES LTD.", type: "stocks", exchange: "BSE" },
  { symbol: "NSE:TATAMOTORS-EQ", description: "TATA MOTORS LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:TMPV-EQ", description: "TATA MOTORS PASS VEH LTD", type: "stocks", exchange: "NSE" },
  { symbol: "BSE:TMPV-A", description: "TATA MOTORS PASSENGER VEHICLES", type: "stocks", exchange: "BSE" },
  { symbol: "NSE:TATACONSUM-EQ", description: "TATA CONSUMER PRODUCT LTD", type: "stocks", exchange: "NSE" },
  { symbol: "BSE:TATACONSUM-A", description: "TATA CONSUMER PRODUCTS LIMITED", type: "stocks", exchange: "BSE" },
  { symbol: "NSE:TATACOMM-EQ", description: "TATA COMMUNICATIONS LTD", type: "stocks", exchange: "NSE" },
  { symbol: "BSE:TATACOMM-A", description: "TATA COMMUNICATIONS LTD.", type: "stocks", exchange: "BSE" },
  { symbol: "NSE:TATAELXSI-EQ", description: "TATA ELXSI LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:TATAPOWER-EQ", description: "TATA POWER CO LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:TATACHEM-EQ", description: "TATA CHEMICALS LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:TATAINVEST-EQ", description: "TATA INVESTMENT CORP LTD", type: "stocks", exchange: "NSE" },

  // Other Top Stocks
  { symbol: "NSE:RELIANCE-EQ", description: "RELIANCE INDUSTRIES LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:HDFCBANK-EQ", description: "HDFC BANK LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:ICICIBANK-EQ", description: "ICICI BANK LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:INFY-EQ", description: "INFOSYS LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:SBIN-EQ", description: "STATE BANK OF INDIA", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:ITC-EQ", description: "ITC LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:LT-EQ", description: "LARSEN & TOUBRO LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:KOTAKBANK-EQ", description: "KOTAK MAHINDRA BANK", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:AXISBANK-EQ", description: "AXIS BANK LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:HINDUNILVR-EQ", description: "HINDUSTAN UNILEVER LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:BHARTIARTL-EQ", description: "BHARTI AIRTEL LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:BAJFINANCE-EQ", description: "BAJAJ FINANCE LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:MARUTI-EQ", description: "MARUTI SUZUKI INDIA LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:ASIANPAINT-EQ", description: "ASIAN PAINTS LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:HCLTECH-EQ", description: "HCL TECHNOLOGIES LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:SUNPHARMA-EQ", description: "SUN PHARMACEUTICAL IND", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:TITAN-EQ", description: "TITAN COMPANY LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:ADANIENT-EQ", description: "ADANI ENTERPRISES LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:ULTRACEMCO-EQ", description: "ULTRATECH CEMENT LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:WIPRO-EQ", description: "WIPRO LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:NTPC-EQ", description: "NTPC LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:POWERGRID-EQ", description: "POWER GRID CORP OF INDIA", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:JSWSTEEL-EQ", description: "JSW STEEL LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:M&M-EQ", description: "MAHINDRA & MAHINDRA LTD", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:ONGC-EQ", description: "OIL & NATURAL GAS CORP", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:COALINDIA-EQ", description: "COAL INDIA LIMITED", type: "stocks", exchange: "NSE" },
  { symbol: "NSE:ADANIPORTS-EQ", description: "ADANI PORTS & SEZ LTD", type: "stocks", exchange: "NSE" },

  // Futures
  { symbol: "NSE:NIFTY26JUNFUT", description: "NIFTY 50 JUN FUTURES", type: "futures", exchange: "NSE" },
  { symbol: "NSE:BANKNIFTY26JUNFUT", description: "BANK NIFTY JUN FUTURES", type: "futures", exchange: "NSE" },
  { symbol: "NSE:TATASTEEL26JUNFUT", description: "TATA STEEL JUN FUTURES", type: "futures", exchange: "NSE" },
  { symbol: "NSE:RELIANCE26JUNFUT", description: "RELIANCE INDUSTRIES JUN FUTURES", type: "futures", exchange: "NSE" },

  // Options
  { symbol: "NSE:NIFTY26JUN22000CE", description: "NIFTY 50 JUN 22000 CALL", type: "options", exchange: "NSE" },
  { symbol: "NSE:NIFTY26JUN22000PE", description: "NIFTY 50 JUN 22000 PUT", type: "options", exchange: "NSE" },

  // ETFs
  { symbol: "NSE:NIFTYBEES-EQ", description: "NIPPON INDIA ETF NIFTY BEES", type: "etfs", exchange: "NSE" },
  { symbol: "NSE:BANKBEES-EQ", description: "NIPPON INDIA ETF BANK BEES", type: "etfs", exchange: "NSE" },
  { symbol: "NSE:GOLDBEES-EQ", description: "NIPPON INDIA ETF GOLD BEES", type: "etfs", exchange: "NSE" },
];

export function getLotSize(symbol: string, type?: string): number {
  const sym = symbol.toUpperCase();
  
  if (type === "stocks" || type === "etfs" || type === "indices") {
    return 1;
  }
  
  const isDerivative = type === "options" || type === "futures" || sym.includes("CE") || sym.includes("PE") || sym.includes("FUT");
  if (!isDerivative) {
    return 1;
  }
  
  if (sym.includes("BANKNIFTY") || sym.includes("NIFTYBANK")) return 15;
  if (sym.includes("FINNIFTY") || sym.includes("NIFTYFINSERVICE")) return 25;
  if (sym.includes("MIDCPNIFTY")) return 50;
  if (sym.includes("NIFTYNEXT50")) return 25;
  if (sym.includes("NIFTY")) return 25;
  
  if (sym.includes("TATASTEEL")) return 5500;
  if (sym.includes("TCS")) return 175;
  if (sym.includes("RELIANCE")) return 250;
  if (sym.includes("INFY")) return 400;
  if (sym.includes("SBIN")) return 750;
  if (sym.includes("ITC")) return 1600;
  if (sym.includes("LT")) return 300;
  if (sym.includes("KOTAKBANK")) return 400;
  if (sym.includes("AXISBANK")) return 625;
  if (sym.includes("HINDUNILVR")) return 300;
  if (sym.includes("BHARTIARTL")) return 950;
  if (sym.includes("BAJFINANCE")) return 125;
  if (sym.includes("MARUTI")) return 50;
  if (sym.includes("ASIANPAINT")) return 200;
  if (sym.includes("HCLTECH")) return 350;
  if (sym.includes("SUNPHARMA")) return 350;
  if (sym.includes("TITAN")) return 175;
  if (sym.includes("WIPRO")) return 1500;
  if (sym.includes("M&M")) return 350;
  if (sym.includes("JSWSTEEL")) return 675;
  if (sym.includes("POWERGRID")) return 3600;
  if (sym.includes("NTPC")) return 3000;
  if (sym.includes("ADANIENT")) return 300;
  if (sym.includes("ADANIPORTS")) return 800;
  if (sym.includes("COALINDIA")) return 4200;
  if (sym.includes("ONGC")) return 3850;
  if (sym.includes("ULTRACEMCO")) return 100;

  return 1;
}
