"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingDown,
  Copy,
  Check,
  AlertOctagon,
  Lightbulb,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Clock,
  Shield,
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { FYERS_SYMBOLS_MASTER, getLotSize } from "@/lib/fyers/symbols";
import { PreMarketRoutineRow } from "@/components/dashboard/pre-market-routine-row";

function getCleanSymbolName(symbol: string, customSym?: string): string {
  if (symbol === "Custom") return customSym || "Custom";
  const clean = symbol.includes(":") ? symbol.split(":")[1] : symbol;
  return clean.includes("-") ? clean.split("-")[0] : clean;
}

export default function CalculatorPage() {
  const [accountSize, setAccountSize] = useState<string>("100000");
  const [dailyMaxLossPercent, setDailyMaxLossPercent] = useState<string>("3");
  const [tradesPlannedPerDay, setTradesPlannedPerDay] = useState<string>("5");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Layout & Autocomplete States
  const [settingsExpanded, setSettingsExpanded] = useState<boolean>(true);
  const [symbolSearchOpen, setSymbolSearchOpen] = useState<boolean>(false);
  const [activeSearchCategory, setActiveSearchCategory] = useState<"all" | "stocks" | "futures" | "options" | "etfs" | "indices">("all");

  // Advanced Stop Loss Helper States
  const [slMethod, setSlMethod] = useState<"manual" | "atr" | "timeframe">("atr");
  const [tradeDirection, setTradeDirection] = useState<"long" | "short">("long");
  const [atrVal, setAtrVal] = useState<string>("80");
  const [atrMultiplier, setAtrMultiplier] = useState<string>("2");

  // Timeframe Sizing States
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("15m");
  const [selectedInstrument, setSelectedInstrument] = useState<string>("Nifty 50");
  const [customInstrument, setCustomInstrument] = useState<string>("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSymbols, setFilteredSymbols] = useState<any[]>([]);
  const [searchingSymbols, setSearchingSymbols] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Close combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [fetchingTimeframe, setFetchingTimeframe] = useState(false);
  const [timeframeData, setTimeframeData] = useState<{ close: number; low: number; high: number } | null>(null);

  // Live Market Sentiment State
  const [marketData, setMarketData] = useState<any>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  const fetchMarketSentiment = async () => {
    setLoadingMarket(true);
    try {
      const res = await fetch("/api/market");
      const data = await res.json();
      if (data && !data.error) {
        setMarketData(data);
      }
    } catch (err) {
      console.error("Failed to fetch market data:", err);
    } finally {
      setLoadingMarket(false);
    }
  };

  const fetchTimeframePrices = async (tf: string, symbol: string) => {
    setFetchingTimeframe(true);
    try {
      const res = await fetch(`/api/market/timeframe-low?timeframe=${tf}&symbol=${encodeURIComponent(symbol)}`);
      const data = await res.json();
      if (data && !data.error) {
        setTimeframeData(data);
        // Auto-fill entry price
        if (data.close) {
          setEntryPrice(data.close.toString());
        }
        // Auto-fill ATR value
        if (data.atr) {
          setAtrVal(data.atr.toString());
        }
        // Auto-fill stop loss price
        const sl = tradeDirection === "long" ? data.low : data.high;
        setStopLossPrice(sl.toString());
      }
    } catch (err) {
      console.error("Failed to fetch timeframe prices:", err);
    } finally {
      setFetchingTimeframe(false);
    }
  };

  const handleInstrumentChange = (inst: string) => {
    setSelectedInstrument(inst);
    if (inst === "Nifty 50") setAtrVal("80");
    else if (inst === "Nifty Bank" || inst === "Bank Nifty") setAtrVal("250");
    else if (inst === "Fin Nifty") setAtrVal("100");
    else if (inst === "Midcap Nifty") setAtrVal("60");
    else if (inst === "Nifty Next 50") setAtrVal("120");
    else if (inst === "Custom") setAtrVal(""); // User sets their own ATR
  };

  // Load preferences from localStorage on mount & fetch default instrument
  useEffect(() => {
    async function loadDefaults() {
      try {
        const res = await fetch("/api/pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.defaultInstrument) {
            const standardInstruments = ["Nifty 50", "Nifty Bank", "Bank Nifty", "Fin Nifty", "Midcap Nifty", "Nifty Next 50"];
            if (standardInstruments.includes(data.defaultInstrument)) {
              setSelectedInstrument(data.defaultInstrument);
              if (data.defaultInstrument === "Nifty 50") setAtrVal("80");
              else if (data.defaultInstrument === "Nifty Bank" || data.defaultInstrument === "Bank Nifty") setAtrVal("250");
              else if (data.defaultInstrument === "Fin Nifty") setAtrVal("100");
              else if (data.defaultInstrument === "Midcap Nifty") setAtrVal("60");
              else if (data.defaultInstrument === "Nifty Next 50") setAtrVal("120");
            } else {
              setSelectedInstrument("Custom");
              setCustomInstrument(data.defaultInstrument);
              setAtrVal("");
            }
          }
        }
      } catch { /* ignore */ }
    }

    if (typeof window !== "undefined") {
      const savedMethod = localStorage.getItem("introspect_default_sl_method");
      if (savedMethod === "manual" || savedMethod === "atr" || savedMethod === "timeframe") {
        setSlMethod(savedMethod);
      }
      const savedTimeframe = localStorage.getItem("introspect_default_timeframe");
      if (savedTimeframe) {
        setSelectedTimeframe(savedTimeframe);
      }
    }
    loadDefaults();
    fetchMarketSentiment();
  }, []);

  const handleSlMethodChange = (method: "manual" | "atr" | "timeframe") => {
    setSlMethod(method);
    if (typeof window !== "undefined") {
      localStorage.setItem("introspect_default_sl_method", method);
    }
  };

  const handleTimeframeChange = (tf: string) => {
    setSelectedTimeframe(tf);
    if (typeof window !== "undefined") {
      localStorage.setItem("introspect_default_timeframe", tf);
    }
  };

  // Fetch prices and ATR when timeframe, direction, or instrument changes
  useEffect(() => {
    const inst = selectedInstrument === "Custom" ? customInstrument : selectedInstrument;
    if (inst) {
      fetchTimeframePrices(selectedTimeframe, inst);
    }
  }, [selectedTimeframe, tradeDirection, selectedInstrument, customInstrument]);

  const comboboxOptions = useMemo(() => {
    const standardOptions = ["Nifty 50", "Nifty Bank", "Fin Nifty", "Nifty Next 50", "Midcap Nifty"];
    const query = searchQuery.trim().toLowerCase();
    
    // If query is empty or matches the currently selected instrument (i.e. focused/opened without typing yet),
    // show all standard options plus Custom.
    const isInitialFocus = selectedInstrument.toLowerCase() === query;
    if (query === "" || isInitialFocus) {
      return [...standardOptions, "Custom"];
    }
    
    const filtered = standardOptions.filter(opt => opt.toLowerCase().includes(query));
    
    // Add custom option if query does not match any standard options
    const matchesAny = standardOptions.some(opt => opt.toLowerCase() === query);
    if (!matchesAny) {
      return [...filtered, "Custom"];
    }
    
    return filtered;
  }, [searchQuery, selectedInstrument]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!comboboxOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setComboboxOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % comboboxOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + comboboxOptions.length) % comboboxOptions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (comboboxOptions.length > 0) {
        const selected = comboboxOptions[highlightedIndex];
        if (selected === "Custom") {
          const symbol = searchQuery.trim() !== "" ? searchQuery.trim().toUpperCase() : "";
          setSelectedInstrument("Custom");
          if (symbol) {
            setCustomInstrument(symbol);
          }
          handleInstrumentChange("Custom");
        } else {
          handleInstrumentChange(selected);
        }
        setComboboxOpen(false);
      }
    } else if (e.key === "Escape") {
      setComboboxOpen(false);
    }
  };

  // Debounced live fetch for symbol search modal
  useEffect(() => {
    if (!symbolSearchOpen) return;

    let active = true;
    const query = searchQuery.trim();

    const getLocalFallback = () => {
      let list = FYERS_SYMBOLS_MASTER;
      if (activeSearchCategory !== "all") {
        list = list.filter(item => item.type === activeSearchCategory);
      }
      if (!query) {
        return list.slice(0, 15);
      }
      const qLower = query.toLowerCase();
      return list.filter(
        item =>
          item.symbol.toLowerCase().includes(qLower) ||
          item.description.toLowerCase().includes(qLower)
      );
    };

    if (!query) {
      setFilteredSymbols(getLocalFallback());
      setSearchingSymbols(false);
      return;
    }

    setSearchingSymbols(true);

    const delayDebounce = setTimeout(async () => {
      try {
        const url = `/api/market/symbols?q=${encodeURIComponent(query)}&category=${activeSearchCategory}`;
        const res = await fetch(url);
        if (res.ok && active) {
          const data = await res.json();
          if (data && Array.isArray(data.symbols)) {
            setFilteredSymbols(data.symbols);
          } else {
            setFilteredSymbols(getLocalFallback());
          }
        } else if (active) {
          setFilteredSymbols(getLocalFallback());
        }
      } catch (err) {
        console.error("Failed to fetch symbols:", err);
        if (active) {
          setFilteredSymbols(getLocalFallback());
        }
      } finally {
        if (active) {
          setSearchingSymbols(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [searchQuery, activeSearchCategory, symbolSearchOpen]);

  // Compute dynamic stop loss price
  const computedStopLossPrice = useMemo(() => {
    if (slMethod === "manual" || slMethod === "timeframe") {
      return stopLossPrice;
    }
    const entry = parseFloat(entryPrice) || 0;
    if (!entry) return "";

    if (slMethod === "atr") {
      const atr = parseFloat(atrVal) || 0;
      const mult = parseFloat(atrMultiplier) || 2;
      if (!atr) return "";
      const val = tradeDirection === "long" ? entry - atr * mult : entry + atr * mult;
      return (Math.round(val * 100) / 100).toString();
    }
    return "";
  }, [slMethod, tradeDirection, entryPrice, atrVal, atrMultiplier, stopLossPrice]);

  const result = useMemo(() => {
    const account = parseFloat(accountSize) || 0;
    const dailyMaxLossPct = parseFloat(dailyMaxLossPercent) || 0;
    const tradesPerDay = parseInt(tradesPlannedPerDay) || 1;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(slMethod === "manual" || slMethod === "timeframe" ? stopLossPrice : computedStopLossPrice) || 0;

    if (!account || !dailyMaxLossPct || !tradesPerDay) {
      return null;
    }

    const dailyMaxLossAmount = (account * dailyMaxLossPct) / 100;
    const riskPerTrade = dailyMaxLossAmount / tradesPerDay;
    const riskPerTradePercent = (riskPerTrade / account) * 100;

    const instSymbol = selectedInstrument === "Custom" ? customInstrument : selectedInstrument;
    const matchedSymbolInfo = FYERS_SYMBOLS_MASTER.find(item => item.symbol === instSymbol);
    const lotSize = getLotSize(instSymbol, matchedSymbolInfo?.type);

    if (!entry || !sl || entry === sl) {
      return {
        dailyMaxLossAmount: Math.round(dailyMaxLossAmount),
        riskPerTrade: Math.round(riskPerTrade),
        riskPerTradePercent: riskPerTradePercent.toFixed(2),
        tradesPerDay,
        quantity: null,
        actualRisk: null,
        slDistance: null,
        direction: null,
        riskOfCapital: null,
        lotSize,
        lots: 0,
      };
    }

    const slDistance = Math.abs(entry - sl);
    const rawQuantity = Math.floor(riskPerTrade / slDistance);
    
    let quantity = rawQuantity;
    let lots = 0;
    if (lotSize > 1) {
      lots = Math.floor(rawQuantity / lotSize);
      quantity = lots * lotSize;
    }

    const actualRisk = quantity * slDistance;

    return {
      dailyMaxLossAmount: Math.round(dailyMaxLossAmount),
      riskPerTrade: Math.round(riskPerTrade),
      riskPerTradePercent: riskPerTradePercent.toFixed(2),
      tradesPerDay,
      slDistance: slDistance.toFixed(2),
      quantity,
      actualRisk: Math.round(actualRisk),
      direction: tradeDirection.toUpperCase(),
      riskOfCapital: ((actualRisk / account) * 100).toFixed(2),
      lotSize,
      lots,
    };
  }, [accountSize, dailyMaxLossPercent, tradesPlannedPerDay, entryPrice, stopLossPrice, slMethod, computedStopLossPrice, tradeDirection, selectedInstrument, customInstrument]);

  const handleCopy = () => {
    if (!result || result.quantity === null) return;
    const slVal = slMethod === "manual" || slMethod === "timeframe" ? stopLossPrice : computedStopLossPrice;
    const lotsText = result.lotSize && result.lotSize > 1 ? ` (${result.lots} Lots)` : "";
    const text = `Position Size: ${result.quantity} qty${lotsText} | Direction: ${result.direction} | Entry: ₹${entryPrice} | SL: ₹${slVal} | Risk: ₹${result.actualRisk} (${result.riskOfCapital}%) | Daily Limit: ₹${result.dailyMaxLossAmount}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskLevel =
    parseFloat(dailyMaxLossPercent) <= 2
      ? { label: "Conservative", color: "text-success", bg: "bg-success/10" }
      : parseFloat(dailyMaxLossPercent) <= 3
        ? { label: "Recommended", color: "text-success", bg: "bg-success/10" }
        : parseFloat(dailyMaxLossPercent) <= 5
          ? { label: "Moderate", color: "text-amber-500", bg: "bg-amber-500/10" }
          : { label: "Aggressive", color: "text-destructive", bg: "bg-destructive/10" };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
          Sizer & Sentiment Console
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Evaluate real-time market sentiment and calculate optimal share quantities under strict risk boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: Market Sentiment Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Activity className="h-4 w-4 text-primary" />
                  {marketData?.market_status === "OPEN" && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success animate-ping" />
                  )}
                </div>
                <h3 className="font-heading text-xs font-bold uppercase tracking-wider">
                  Market Intelligence
                </h3>
              </div>
              <button
                onClick={fetchMarketSentiment}
                disabled={loadingMarket}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingMarket ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingMarket && !marketData ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground/40" />
              </div>
            ) : marketData ? (
              <div className="space-y-4">
                {/* Zone Classification */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Market Bias</span>
                    <div className="flex items-center gap-2">
                      {marketData.failsafe_mode ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive animate-pulse uppercase">
                          FAIL-SAFE ACTIVE
                        </span>
                      ) : marketData.zone_status === "WATCH" ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 animate-pulse uppercase">
                          WATCH ({marketData.confirmation_count}/3)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-success/15 text-success uppercase">
                          CONFIRMED
                        </span>
                      )}
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider border uppercase ${
                        marketData.market_zone === "Positive Market Bias" 
                          ? "bg-success/20 text-success border-success/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]" 
                          : marketData.market_zone === "Negative Market Bias" 
                          ? "bg-destructive/20 text-destructive border-destructive/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]" 
                          : "bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                      }`}>
                        {marketData.market_zone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/30 pt-2 text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className={`font-bold uppercase ${
                      marketData.confidence === "HIGH" ? "text-success" :
                      marketData.confidence === "MODERATE" ? "text-amber-500" :
                      "text-muted-foreground"
                    }`}>
                      {marketData.confidence || "LOW"}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/40">
                    {marketData.market_zone === "Positive Market Bias" && (
                      "Current market indicators show positive directional alignment. Market conditions may be supportive of bullish market behavior."
                    )}
                    {marketData.market_zone === "Negative Market Bias" && (
                      "Current market indicators show negative directional alignment. Market conditions may be supportive of bearish market behavior."
                    )}
                    {marketData.market_zone === "Neutral Market Bias" && (
                      "Current market indicators are mixed or lack directional confirmation. Current conditions do not indicate a strong directional market bias."
                    )}
                  </div>

                  {/* Watch State Progress Bar */}
                  {marketData.zone_status === "WATCH" && !marketData.failsafe_mode && (
                    <div className="rounded-lg bg-amber-500/[0.03] border border-amber-500/10 p-2.5 space-y-1.5 animate-pulse">
                      <div className="flex items-center justify-between text-[10px] text-amber-500 font-semibold">
                        <span>Stabilizing Bias...</span>
                        <span>{marketData.confirmation_count} / 3 Confirmations</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${(marketData.confirmation_count / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Persistence Timer */}
                  {marketData.zone_status === "CONFIRMED" && marketData.stability_duration && !marketData.failsafe_mode && (
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground bg-muted/20 border border-border/30 px-3 py-1 rounded-lg">
                      <span>Bias Stability:</span>
                      <span className="text-foreground font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                        Stable for {marketData.stability_duration}
                      </span>
                    </div>
                  )}
                </div>

                {/* Radar Score Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Momentum Score</span>
                    <span className="text-foreground">{marketData.radar_score}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        marketData.radar_score >= 65 ? "bg-success" : marketData.radar_score >= 40 ? "bg-amber-500" : "bg-destructive"
                      }`}
                      style={{ width: `${marketData.radar_score}%` }}
                    />
                  </div>
                </div>

                {/* Snapshot Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Nifty 50</span>
                    <span className="font-mono font-bold text-foreground text-sm">₹{marketData.nifty_price.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">India VIX</span>
                    <span className="font-mono font-bold text-foreground text-sm">{marketData.vix}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Put-Call Ratio</span>
                    <span className="font-mono font-bold text-foreground text-sm">{marketData.pcr}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Advances/Declines</span>
                    <span className="font-mono font-bold text-foreground text-sm">{marketData.advances} : {marketData.declines}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Market Regime</span>
                    <span className={`font-mono font-bold text-sm ${
                      marketData.regime === "TREND_DAY" ? "text-success" : marketData.regime === "VOLATILE" ? "text-destructive" : marketData.regime === "COMPRESSION" ? "text-amber-500" : "text-foreground"
                    }`}>
                      {marketData.regime?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Zone Stability</span>
                    <span className={`font-mono font-bold text-sm ${
                      marketData.stability === "STABLE" ? "text-success" : marketData.stability === "WATCH" ? "text-amber-500" : "text-destructive"
                    }`}>
                      {marketData.stability}
                    </span>
                  </div>
                </div>

                {/* Insights List */}
                <div className="space-y-1.5 border-t border-border/40 pt-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-bold">Insights Summary</span>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {marketData.reasons?.map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-primary mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border/30 pt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-white/80 font-mono">
                    <span>Source: Third-party data providers</span>
                    <span className="capitalize">Market: {marketData.market_status.toLowerCase()}</span>
                  </div>
                  <p className="text-[9px] text-white/70 leading-normal text-justify">
                    This assessment is generated using quantitative market indicators and is provided for informational and educational purposes only. It does not constitute investment advice, a recommendation, research report, or a solicitation to buy or sell any security. Users should exercise independent judgment before making trading decisions.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-4">No live market data available.</p>
            )}
          </div>

          {/* Stop Trading Signal Card */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-4">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="h-4.5 w-4.5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-destructive mb-1 uppercase tracking-wider">
                  Stop Trading Rule
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once your ₹{result?.dailyMaxLossAmount.toLocaleString("en-IN") || ((parseFloat(accountSize) * parseFloat(dailyMaxLossPercent)) / 100).toLocaleString("en-IN")} daily loss threshold is reached, <span className="font-bold text-destructive">CLOSE TERMINAL</span> immediately. No exceptions.
                </p>
              </div>
            </div>
          </div>

          {/* Pro tip Card */}
          <div className="rounded-2xl border border-success/20 bg-success/[0.04] p-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="h-4.5 w-4.5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-success mb-1 uppercase tracking-wider">
                  Position Sizing Pro Tip
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Never bet your entire daily loss threshold on a single entry. By splitting it into {tradesPlannedPerDay} planned trades, you maintain a mathematical buffer to weather random market noise.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Sizing Parameters Form */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-bold">
                    Sizing Parameters
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Define your setup guidelines to automatically calculate share quantity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await fetchMarketSentiment();
                  await fetchTimeframePrices(selectedTimeframe, selectedInstrument);
                }}
                disabled={loadingMarket || fetchingTimeframe}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${(loadingMarket || fetchingTimeframe) ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
            </div>

            {/* Trade Direction Selector */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Direction</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTradeDirection("long")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    tradeDirection === "long"
                      ? "border-success bg-success/[0.06] text-success font-bold"
                      : "border-border text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  LONG (Buy)
                </button>
                <button
                  type="button"
                  onClick={() => setTradeDirection("short")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    tradeDirection === "short"
                      ? "border-destructive bg-destructive/[0.06] text-destructive font-bold"
                      : "border-border text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  SHORT (Sell)
                </button>
              </div>
            </div>

            {/* Trading Instrument Selector (Triggers Popup Modal) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold mb-1 block">Trading Instrument</label>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery(selectedInstrument === "Custom" ? customInstrument : selectedInstrument);
                  setSymbolSearchOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-medium hover:border-success/40 transition-all text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  {selectedInstrument === "Custom" 
                    ? (customInstrument || "Enter custom symbol...") 
                    : (selectedInstrument || "Select Instrument...")}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Active Stop Loss Strategy Display */}
            <div className="rounded-xl border border-success/20 bg-success/[0.03] p-3.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Active Stop Loss Strategy</span>
              <span className="font-bold text-success flex items-center gap-1.5 uppercase tracking-wide">
                <Shield className="h-4 w-4" />
                {slMethod === "manual" ? "Manual" : slMethod === "atr" ? "ATR-Based" : `${selectedTimeframe} Timeframe`}
              </span>
            </div>

            {/* Entry / Stop Loss inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="entry-price" className="text-xs font-medium mb-1.5 block">Entry Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input
                    id="entry-price"
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    disabled={slMethod === "timeframe"}
                    className={`w-full pl-7 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all ${
                      slMethod === "timeframe" ? "bg-muted/40 cursor-not-allowed border-dashed" : ""
                    }`}
                    placeholder="Entry Level"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sl-price" className="text-xs font-medium mb-1.5 block">
                  Stop Loss Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input
                    id="sl-price"
                    type="number"
                    value={slMethod === "manual" ? stopLossPrice : computedStopLossPrice}
                    onChange={(e) => {
                      if (slMethod === "manual" || slMethod === "timeframe") setStopLossPrice(e.target.value);
                    }}
                    disabled={slMethod === "atr"}
                    className={`w-full pl-7 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-destructive/40 focus:ring-1 focus:ring-destructive/20 transition-all ${
                      slMethod === "atr"
                        ? "bg-muted/40 cursor-not-allowed border-dashed text-foreground/80 font-semibold"
                        : ""
                    }`}
                    placeholder="SL Level"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Helper Controls */}
            {slMethod === "atr" && (
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">
                      ATR (Average True Range)
                    </label>
                    <input
                      type="number"
                      value={atrVal}
                      onChange={(e) => setAtrVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-xs font-mono focus:outline-none"
                      placeholder="Points"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">
                      ATR Multiplier
                    </label>
                    <select
                      value={atrMultiplier}
                      onChange={(e) => setAtrMultiplier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="1.0">1.0x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2.0">2.0x (Standard)</option>
                      <option value="2.5">2.5x</option>
                      <option value="3.0">3.0x (Conservative)</option>
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Formula: {tradeDirection === "long" 
                    ? `${entryPrice || "Entry"} - (${atrVal || "ATR"} * ${atrMultiplier}) = ${computedStopLossPrice || "?"}`
                    : `${entryPrice || "Entry"} + (${atrVal || "ATR"} * ${atrMultiplier}) = ${computedStopLossPrice || "?"}`
                  }
                </p>
              </div>
            )}

            {slMethod === "timeframe" && (
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">
                      Candle Resolution Timeframe
                    </label>
                    <div className="flex gap-2 w-full">
                      <select
                        value={selectedTimeframe}
                        onChange={(e) => handleTimeframeChange(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none cursor-pointer font-semibold"
                      >
                        <option value="5m">5 Minute</option>
                        <option value="15m">15 Minute</option>
                        <option value="30m">30 Minute</option>
                        <option value="1h">1 Hour</option>
                        <option value="4h">4 Hour</option>
                        <option value="1d">Daily (1D)</option>
                      </select>
                      <button
                        onClick={() => fetchTimeframePrices(selectedTimeframe, selectedInstrument)}
                        disabled={fetchingTimeframe}
                        className="px-3 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${fetchingTimeframe ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {fetchingTimeframe ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Fetching {getCleanSymbolName(selectedInstrument, customInstrument)} levels...</span>
                  </div>
                ) : timeframeData ? (
                  <div className="text-[11px] text-muted-foreground font-mono bg-background/40 p-2.5 rounded-lg border border-border/30 space-y-1">
                    <div className="flex justify-between">
                      <span>{getCleanSymbolName(selectedInstrument, customInstrument)} Close (Entry):</span>
                      <span className="font-semibold text-foreground">₹{timeframeData.close}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {getCleanSymbolName(selectedInstrument, customInstrument)}{" "}
                        {tradeDirection === "long" ? "Low" : "High"} (Stop):
                      </span>
                      <span className="font-semibold text-destructive">
                        ₹{tradeDirection === "long" ? timeframeData.low : timeframeData.high}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-semibold text-foreground">
                      <span>Stop Loss Gap:</span>
                      <span>₹{(Math.round(Math.abs(timeframeData.close - (tradeDirection === "long" ? timeframeData.low : timeframeData.high)) * 100) / 100).toFixed(2)} pts</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-destructive italic">Failed to retrieve {getCleanSymbolName(selectedInstrument, customInstrument)} metrics. Falling back to manual parameters.</p>
                )}
              </div>
            )}

            {/* Account & Sizing Configuration Accordion */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
              <button
                type="button"
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  Account & Risk Configuration
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${settingsExpanded ? "rotate-180" : ""}`} />
              </button>

              {settingsExpanded && (
                <div className="space-y-4 pt-3 border-t border-border/40 animate-fade-down-custom">
                  {/* Stop Loss Sizing Method Selector */}
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Stop Loss Strategy</label>
                    <div className="flex gap-1.5 p-1 rounded-xl bg-background/50 border border-border">
                      {["manual", "atr", "timeframe"].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => handleSlMethodChange(method as any)}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-semibold capitalize transition-colors cursor-pointer ${
                            slMethod === method
                              ? "bg-card text-foreground border border-border shadow-sm font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {method === "manual" ? "Manual" : method === "atr" ? "ATR-Based" : "Timeframe Low"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Capital */}
                  <div>
                    <label htmlFor="account-size" className="text-xs font-semibold mb-1.5 block">
                      Account Capital
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <input
                        id="account-size"
                        type="number"
                        value={accountSize}
                        onChange={(e) => setAccountSize(e.target.value)}
                        className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40"
                        placeholder="100000"
                      />
                    </div>
                  </div>

                  {/* Daily Max Loss % Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="daily-max-loss" className="text-xs font-semibold">Daily Max Loss Limit</label>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${riskLevel.bg} ${riskLevel.color}`}>
                        {riskLevel.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id="daily-max-loss"
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={dailyMaxLossPercent}
                        onChange={(e) => setDailyMaxLossPercent(e.target.value)}
                        className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-success"
                      />
                      <div className="w-12 text-right">
                        <span className="text-sm font-bold font-heading">{dailyMaxLossPercent}</span>
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Trades Planned Per Day */}
                  <div>
                    <label htmlFor="trades-per-day" className="text-xs font-semibold mb-1.5 block">
                      Planned Trades Per Day
                    </label>
                    <input
                      id="trades-per-day"
                      type="number"
                      min="1"
                      max="50"
                      value={tradesPlannedPerDay}
                      onChange={(e) => setTradesPlannedPerDay(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none"
                      placeholder="5"
                    />
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Column 3: Sizing Recommendation */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {result && result.quantity !== null ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-success/30 bg-success/[0.04] p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xs font-bold text-success uppercase tracking-wider">
                  Sizing Recommendation
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    result.direction === "LONG"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {result.direction}
                </span>
              </div>

              {/* Main Quantity Display */}
              <div className="text-center py-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Optimal Order Quantity
                </p>
                <span className="text-5xl font-bold font-heading text-foreground">
                  {result.quantity}
                </span>
                <span className="text-base text-muted-foreground ml-2">qty</span>
                {result.lotSize > 1 && (
                  <div className="text-xs text-success font-semibold mt-1">
                    ({result.lots} {result.lots === 1 ? "Lot" : "Lots"} of {result.lotSize} qty)
                  </div>
                )}
              </div>

              {/* Position Details */}
              <div className="space-y-2.5 pt-3 border-t border-border/50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Daily Loss Limit Cap</span>
                  <span className="font-mono font-medium">₹{result.dailyMaxLossAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Budget Risk (Per Trade)</span>
                  <span className="font-mono font-medium">₹{result.riskPerTrade.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Actual Risk exposure</span>
                  <span className="font-mono font-semibold text-amber-500">₹{result.actualRisk?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stop Loss Distance</span>
                  <span className="font-mono font-medium">₹{result.slDistance} pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">% of Account Capital</span>
                  <span className={`font-mono font-semibold ${parseFloat(result.riskOfCapital || "0") <= 1 ? "text-success" : "text-amber-500"}`}>
                    {result.riskOfCapital}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Sizing details
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
              <Info className="h-8 w-8 text-muted-foreground/20 mb-3" />
              <p className="text-xs text-amber-500 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-full">
                {(!entryPrice && !computedStopLossPrice) ? "Define Entry & Stop Loss Parameters" : 
                 !entryPrice ? "Fill Entry Price" : 
                 !computedStopLossPrice ? "Fill SL Helper Options" :
                 (parseFloat(entryPrice) === parseFloat(computedStopLossPrice)) ? "Entry & SL Prices cannot be equal" :
                 "Complete parameters to view sizing"}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-2 max-w-[220px]">
                Optimal trade quantities and mathematical risk allocation breakdown will auto-generate here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Symbol Search Modal */}
      <AnimatePresence>
        {symbolSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-3xl h-[80vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h2 className="font-heading text-lg font-bold text-foreground">Symbol Search</h2>
                <button
                  type="button"
                  onClick={() => setSymbolSearchOpen(false)}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search input */}
              <div className="px-6 pt-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by symbol or description (e.g. TATA)..."
                    className="w-full pl-9 pr-10 py-3 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-success/40 transition-all"
                    autoFocus
                  />
                  {searchingSymbols ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Categories Tabs */}
              <div className="px-6 py-2 flex flex-wrap gap-1.5 border-b border-border/30">
                {(
                  [
                    { id: "all", label: "All types" },
                    { id: "stocks", label: "Stocks" },
                    { id: "futures", label: "Futures" },
                    { id: "options", label: "Options" },
                    { id: "etfs", label: "ETFs" },
                    { id: "indices", label: "Indices" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSearchCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeSearchCategory === tab.id
                        ? "bg-foreground text-background font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* List Headers */}
              <div className="px-6 py-2 bg-muted/20 border-b border-border/20 flex text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="w-1/3">Symbol</span>
                <span className="flex-1">Description</span>
                <span className="w-24 text-right">Source</span>
              </div>

              {/* List Results */}
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                {/* Custom Add Ticker Card */}
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const sym = searchQuery.trim().toUpperCase();
                      setSelectedInstrument("Custom");
                      setCustomInstrument(sym);
                      setAtrVal(""); // User will set or API will fetch
                      setSymbolSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted/30 transition-all text-left text-xs border border-dashed border-border/40 hover:border-success/30"
                  >
                    <span className="text-success font-semibold flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      Add Custom &quot;{searchQuery.trim().toUpperCase()}&quot;
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground font-mono">
                      {searchQuery.trim().toUpperCase()}
                    </span>
                  </button>
                )}

                {/* Filtered symbols list */}
                {searchingSymbols && filteredSymbols.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-success" />
                    <span className="text-xs">Searching live markets...</span>
                  </div>
                ) : filteredSymbols.length > 0 ? (
                  filteredSymbols.map((item) => {
                    const isSelected = selectedInstrument === item.symbol;
                    
                    // Highlight matching text in symbol and description
                    const highlightText = (text: string, highlight: string) => {
                      if (!highlight.trim()) return <span>{text}</span>;
                      const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi");
                      const parts = text.split(regex);
                      return (
                        <span>
                          {parts.map((part, i) =>
                            regex.test(part) ? (
                              <mark key={i} className="bg-success/20 text-success font-bold rounded px-0.5">
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      );
                    };

                    return (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => {
                          setSelectedInstrument(item.symbol);
                          setSymbolSearchOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
                          isSelected
                            ? "bg-success/10 border border-success/20"
                            : "hover:bg-muted/40 border border-transparent"
                        }`}
                      >
                        {/* Symbol */}
                        <div className="w-1/3 font-mono text-xs font-bold text-foreground">
                          {highlightText(item.symbol, searchQuery)}
                        </div>
                        {/* Description */}
                        <div className="flex-1 text-xs text-muted-foreground font-medium truncate">
                          {highlightText(item.description, searchQuery)}
                        </div>
                        {/* Badge / Exchange */}
                        <div className="w-24 text-right flex items-center justify-end gap-1.5">
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {item.type === "indices" ? "Index" : item.type === "stocks" ? "Stock" : item.type === "futures" ? "Future" : item.type === "options" ? "Option" : item.type.slice(0, -1)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            item.exchange === "NSE" 
                              ? "bg-blue-500/10 text-blue-400" 
                              : item.exchange === "BSE"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {item.exchange}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  !searchingSymbols && (
                    <div className="text-center py-10 text-xs text-muted-foreground">
                      {searchQuery.trim() ? "No symbols found." : "Type above to search for symbols."}
                    </div>
                  )
                )}
              </div>

              {/* Footer text */}
              <div className="px-6 py-3 bg-muted/10 border-t border-border/30 text-[10px] text-muted-foreground/60 text-center font-mono">
                Simply start typing while on the chart to pull up this search box
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Pre-Market Routine checklist */}
      <PreMarketRoutineRow />
    </div>
  );
}
