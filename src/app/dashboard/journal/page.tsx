"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Loader2,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useTradesQuery, queryKeys } from "@/lib/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";

const emotionColors: Record<string, string> = {
  Calm: "bg-success/10 text-success",
  Focused: "bg-blue-500/10 text-blue-500",
  Frustrated: "bg-destructive/10 text-destructive",
  Anxious: "bg-amber-500/10 text-amber-500",
  Greedy: "bg-purple-500/10 text-purple-500",
  Fearful: "bg-orange-500/10 text-orange-500",
};

const mistakeBadges: Record<string, string> = {
  FOMO: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Revenge Trade": "bg-destructive/10 text-destructive border-destructive/20",
  Overtrading: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "No SL": "bg-red-500/10 text-red-500 border-red-500/20",
  "Over-leveraged": "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

interface TradeRow {
  id: string;
  date: string;
  stock: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  quantity: number;
  pnl: number;
  followed_plan: boolean;
  emotion_before: string | null;
  emotion_after: string | null;
  mistakes: string[];
  notes: string | null;
  created_at: string;
}

export default function JournalPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: tradesData, isLoading } = useTradesQuery();
  const trades = (tradesData as TradeRow[]) || [];
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all"); // "all", "today", "week", "month", or specific date
  const [directionFilter, setDirectionFilter] = useState<string>("all"); // "all", "long", "short"
  const [resultFilter, setResultFilter] = useState<string>("all"); // "all", "profit", "loss"
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    stock: "",
    direction: "long",
    entry_price: "",
    exit_price: "",
    stop_loss: "",
    quantity: "",
    followed_plan: true,
    emotion_before: "Calm",
    notes: "",
    mistake: "",
  });

  const supabase = createClient();
  const loading = isLoading && trades.length === 0;

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const entryPrice = parseFloat(formData.entry_price);
    const exitPrice = parseFloat(formData.exit_price);
    const quantity = parseInt(formData.quantity) || 1;
    const pnl =
      formData.direction === "long"
        ? (exitPrice - entryPrice) * quantity
        : (entryPrice - exitPrice) * quantity;

    const riskPct = formData.stop_loss
      ? Math.abs(entryPrice - parseFloat(formData.stop_loss)) / entryPrice * 100
      : 0;

    const { error } = await supabase.from("trades").insert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      stock: formData.stock,
      direction: formData.direction,
      entry_price: entryPrice,
      exit_price: exitPrice,
      stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
      quantity,
      pnl,
      risk_pct: riskPct,
      followed_plan: formData.followed_plan,
      sl_followed: !!formData.stop_loss,
      emotion_before: formData.emotion_before,
      emotion_after: null,
      notes: formData.notes || null,
      mistakes: formData.mistake ? [formData.mistake] : [],
    });

    if (!error) {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
      setShowAddModal(false);
      setFormData({
        stock: "",
        direction: "long",
        entry_price: "",
        exit_price: "",
        stop_loss: "",
        quantity: "",
        followed_plan: true,
        emotion_before: "Calm",
        notes: "",
        mistake: "",
      });
    }
    setSaving(false);
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!user) return;
    setDeleting(tradeId);
    await supabase.from("trades").delete().eq("id", tradeId).eq("user_id", user.id);
    // Invalidate queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
    setDeleting(null);
  };

  // Apply all filters
  const filteredTrades = trades.filter((t) => {
    // Search filter
    const matchesSearch = 
      t.stock.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.direction.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date filter
    let matchesDate = true;
    const tradeDate = new Date(t.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === "today") {
      const tradeDateOnly = new Date(tradeDate);
      tradeDateOnly.setHours(0, 0, 0, 0);
      matchesDate = tradeDateOnly.getTime() === today.getTime();
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = tradeDate >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = tradeDate >= monthAgo;
    } else if (dateFilter !== "all") {
      // Specific date selected
      matchesDate = t.date === dateFilter;
    }
    
    // Direction filter
    const matchesDirection = directionFilter === "all" || t.direction === directionFilter;
    
    // Result filter
    let matchesResult = true;
    if (resultFilter === "profit") {
      matchesResult = t.pnl > 0;
    } else if (resultFilter === "loss") {
      matchesResult = t.pnl < 0;
    }
    
    return matchesSearch && matchesDate && matchesDirection && matchesResult;
  });

  const totalPnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = filteredTrades.length
    ? Math.round(
        (filteredTrades.filter((t) => t.pnl > 0).length / filteredTrades.length) * 100
      )
    : 0;
  const rulesFollowed = filteredTrades.length
    ? Math.round(
        (filteredTrades.filter((t) => t.followed_plan).length / filteredTrades.length) * 100
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Total P&L
          </p>
          <p
            className={`text-lg font-bold font-heading font-mono ${
              totalPnl >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {totalPnl >= 0 ? "+" : ""}₹{Math.abs(totalPnl).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Win Rate
          </p>
          <p className="text-lg font-bold font-heading">{winRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Trades Logged
          </p>
          <p className="text-lg font-bold font-heading">{filteredTrades.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Rules Followed
          </p>
          <p
            className={`text-lg font-bold font-heading ${
              rulesFollowed >= 80 ? "text-success" : "text-amber-500"
            }`}
          >
            {rulesFollowed}%
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by symbol..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-xs font-semibold shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Trade
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background/50 border border-border text-xs font-medium focus:outline-none focus:border-success/40 transition-all cursor-pointer appearance-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background/50 border border-border text-xs font-medium focus:outline-none focus:border-success/40 transition-all cursor-pointer appearance-none"
          >
            <option value="all">All Directions</option>
            <option value="long">Buy Only</option>
            <option value="short">Sell Only</option>
          </select>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background/50 border border-border text-xs font-medium focus:outline-none focus:border-success/40 transition-all cursor-pointer appearance-none"
          >
            <option value="all">All Results</option>
            <option value="profit">Profits Only</option>
            <option value="loss">Losses Only</option>
          </select>

          {/* Clear Filters */}
          {(dateFilter !== "all" || directionFilter !== "all" || resultFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setDateFilter("all");
                setDirectionFilter("all");
                setResultFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-2 rounded-xl border border-border hover:bg-muted/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}

          {/* Filter count indicator */}
          <span className="text-xs text-muted-foreground ml-auto">
            Showing {filteredTrades.length} of {trades.length} trades
          </span>
        </div>
      </div>

      {/* Trades Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/50">
          <div className="col-span-2">Symbol</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1 text-right">Entry</div>
          <div className="col-span-1 text-right">Exit</div>
          <div className="col-span-1 text-right">Qty</div>
          <div className="col-span-2 text-right">P&L</div>
          <div className="col-span-1">Emotion</div>
          <div className="col-span-1 text-center">Rules</div>
          <div className="col-span-2">Mistake</div>
        </div>

        <div className="divide-y divide-border/50">
          {filteredTrades.map((trade) => (
            <div
              key={trade.id}
              className="group hover:bg-muted/20 transition-colors"
            >
              {/* Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-2 items-center px-5 py-3.5 text-sm">
                <div className="col-span-2">
                  <p className="font-medium text-foreground">{trade.stock}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(trade.created_at).toLocaleDateString("en-IN")} •{" "}
                    {new Date(trade.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      trade.direction === "long"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {trade.direction === "long" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {trade.direction === "long" ? "BUY" : "SELL"}
                  </span>
                </div>
                <div className="col-span-1 text-right font-mono text-xs text-muted-foreground">
                  ₹{trade.entry_price.toLocaleString("en-IN")}
                </div>
                <div className="col-span-1 text-right font-mono text-xs text-muted-foreground">
                  ₹{(trade.exit_price || 0).toLocaleString("en-IN")}
                </div>
                <div className="col-span-1 text-right font-mono text-xs text-muted-foreground">
                  {trade.quantity}
                </div>
                <div
                  className={`col-span-2 text-right font-mono text-xs font-bold ${
                    trade.pnl >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {trade.pnl >= 0 ? "+" : ""}₹
                  {Math.abs(trade.pnl).toLocaleString("en-IN")}
                </div>
                <div className="col-span-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      emotionColors[trade.emotion_before || ""] || "bg-muted text-foreground"
                    }`}
                  >
                    {trade.emotion_before || "—"}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center">
                  {trade.followed_plan ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {trade.mistakes && trade.mistakes.length > 0 ? (
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                        mistakeBadges[trade.mistakes[0]] || "bg-muted text-foreground border-border"
                      }`}
                    >
                      {trade.mistakes[0]}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                  <button
                    onClick={() => handleDeleteTrade(trade.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all cursor-pointer"
                  >
                    {deleting === trade.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="h-3 w-3 text-destructive" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile card */}
              <div className="md:hidden p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        trade.direction === "long"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {trade.direction === "long" ? "BUY" : "SELL"}
                    </span>
                    <span className="font-medium text-sm">{trade.stock}</span>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold ${
                      trade.pnl >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}₹
                    {Math.abs(trade.pnl).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>₹{trade.entry_price.toLocaleString("en-IN")} → ₹{(trade.exit_price || 0).toLocaleString("en-IN")}</span>
                  <span>•</span>
                  <span>{trade.quantity} qty</span>
                </div>
              </div>
            </div>
          ))}
          {filteredTrades.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No trades logged yet. Click &quot;Log Trade&quot; to record your first entry.
            </div>
          )}
        </div>
      </div>

      {/* Add Trade Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card rounded-t-2xl">
                <h3 className="font-heading text-base font-bold">
                  Log New Trade
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form className="p-6 space-y-5" onSubmit={handleAddTrade}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Symbol</label>
                    <input
                      type="text"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))}
                      placeholder="e.g. NIFTY 50"
                      className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Direction</label>
                    <select
                      value={formData.direction}
                      onChange={(e) => setFormData((p) => ({ ...p, direction: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all cursor-pointer appearance-none"
                    >
                      <option value="long">BUY (Long)</option>
                      <option value="short">SELL (Short)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Entry Price</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.entry_price}
                      onChange={(e) => setFormData((p) => ({ ...p, entry_price: e.target.value }))}
                      placeholder="₹"
                      className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Exit Price</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.exit_price}
                      onChange={(e) => setFormData((p) => ({ ...p, exit_price: e.target.value }))}
                      placeholder="₹"
                      className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Quantity</label>
                    <input
                      type="number"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
                      placeholder="Qty"
                      className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Stop-Loss (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stop_loss}
                    onChange={(e) => setFormData((p) => ({ ...p, stop_loss: e.target.value }))}
                    placeholder="₹ Stop-loss price"
                    className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                  />
                </div>

                {/* INTROSPECT™ special fields */}
                <div className="relative pt-5 border-t border-border/50">
                  <span className="absolute -top-2.5 left-4 bg-card px-2 text-[10px] font-bold text-success uppercase tracking-wider">
                    INTROSPECT™ Insights
                  </span>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block">
                      Did you follow your rules?
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, followed_plan: true }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          formData.followed_plan
                            ? "border-success bg-success/[0.06] text-success"
                            : "border-border text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, followed_plan: false }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                          !formData.followed_plan
                            ? "border-amber-500 bg-amber-500/[0.06] text-amber-500"
                            : "border-border text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        No
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-medium mb-1.5 block">
                      Emotional State
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Calm", "Focused", "Anxious", "Frustrated", "Greedy", "Fearful"].map(
                        (emotion) => (
                          <button
                            key={emotion}
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, emotion_before: emotion }))}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              formData.emotion_before === emotion
                                ? `${emotionColors[emotion]} border-current`
                                : "border-border hover:opacity-80"
                            }`}
                          >
                            {emotion}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {!formData.followed_plan && (
                    <div className="mt-4">
                      <label className="text-xs font-medium mb-1.5 block">
                        Mistake Type
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {["FOMO", "Revenge Trade", "Overtrading", "No SL", "Over-leveraged"].map(
                          (mistake) => (
                            <button
                              key={mistake}
                              type="button"
                              onClick={() => setFormData((p) => ({ ...p, mistake }))}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                                formData.mistake === mistake
                                  ? `${mistakeBadges[mistake]} border-current`
                                  : "border-border hover:opacity-80"
                              }`}
                            >
                              {mistake}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="text-xs font-medium mb-1.5 block">
                      Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="What did you learn from this trade?"
                      className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm resize-none focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save Trade Entry"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
