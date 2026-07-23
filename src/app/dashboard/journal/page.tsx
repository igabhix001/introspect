"use client";

import { useState, useRef, useEffect } from "react";
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
  Brain,
  Sparkles,
  Upload,
  Download,
  Info,
  MessageSquareX,
  ThumbsUp,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useTradesQuery, useDailyReportQuery, useChallengesQuery, queryKeys } from "@/lib/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMistakeLabel } from "@/lib/utils";
import { UpgradeModal } from "@/components/paywall/upgrade-modal";

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
  observations?: string[];
  notes: string | null;
  created_at: string;
  reflection_text?: string | null;
  reflection_feedback?: string | null;
  market_sentiment?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
  reversals?: { mistake_key: string; reversal_comment: string }[];
}

export default function JournalPage() {
  const { user, hasActiveSubscription, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: tradesData, isLoading } = useTradesQuery();
  const trades = (tradesData as TradeRow[]) || [];
  
  // Fetch active challenge to show reminder banner
  const { data: challengesData } = useChallengesQuery();
  const activeChallenge = (challengesData?.active as { 
    id: string; 
    type: string; 
    current_day: number; 
    last_checkin_date: string | null;
  }) || null;
  
  // Fetch today's daily report to get mistake tags for trades
  const today = new Date().toISOString().split("T")[0];
  const { data: todayReportData } = useDailyReportQuery(today);
  const todayReport = todayReportData as {
    feedback?: {
      mistakeTags?: Array<{ stock: string; pnl: number; tag: string }>;
    };
  } | null;
  const mistakeTags = todayReport?.feedback?.mistakeTags || [];
  
  // Check if user has already journaled today for the challenge
  const hasJournaledToday = activeChallenge?.last_checkin_date === today;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("today"); // Default to today
  const [directionFilter, setDirectionFilter] = useState<string>("all"); // "all", "long", "short"
  const [resultFilter, setResultFilter] = useState<string>("all"); // "all", "profit", "loss"
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeReflectionTrade, setActiveReflectionTrade] = useState<TradeRow | null>(null);
  const [userReflection, setUserReflection] = useState("");
  const [submittingReflection, setSubmittingReflection] = useState(false);
  
  // Pro Subscription Paywall State
  const isProUser = hasActiveSubscription === true;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("Pro Feature");

  // Bulk upload state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mistake reversal modal state
  const [reversalModal, setReversalModal] = useState<{
    open: boolean;
    tradeId: string;
    mistakeKey: string;
    mistakeLabel: string;
    comment: string;
    submitting: boolean;
    error: string;
  }>({
    open: false,
    tradeId: "",
    mistakeKey: "",
    mistakeLabel: "",
    comment: "",
    submitting: false,
    error: "",
  });

  const handleOpenReversalModal = (tradeId: string, mistakeKey: string) => {
    setReversalModal({
      open: true,
      tradeId,
      mistakeKey,
      mistakeLabel: formatMistakeLabel(mistakeKey),
      comment: "",
      submitting: false,
      error: "",
    });
  };

  const handleSubmitReversal = async () => {
    if (reversalModal.comment.trim().length < 5) {
      setReversalModal((p) => ({ ...p, error: "Please provide a comment of at least 5 characters explaining why this is not a mistake." }));
      return;
    }
    setReversalModal((p) => ({ ...p, submitting: true, error: "" }));
    try {
      const res = await fetch(`/api/trades/${reversalModal.tradeId}/reverse-mistake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mistake_key: reversalModal.mistakeKey,
          reversal_comment: reversalModal.comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReversalModal((p) => ({ ...p, submitting: false, error: data.error || "Failed to submit. Please try again." }));
        return;
      }
      // Success — close modal and refresh trades
      setReversalModal({ open: false, tradeId: "", mistakeKey: "", mistakeLabel: "", comment: "", submitting: false, error: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.trades(user?.id || "") });
    } catch {
      setReversalModal((p) => ({ ...p, submitting: false, error: "Network error. Please try again." }));
    }
  };

  const getHoldingDuration = (entry: string | null, exit: string | null) => {
    if (!entry || !exit) return null;
    try {
      const parseTime = (t: string) => {
        if (t.includes("T") || t.includes("-")) return new Date(t);
        const [h, m, s] = t.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, s || 0, 0);
        return d;
      };
      const t1 = parseTime(entry);
      const t2 = parseTime(exit);
      const diffMins = Math.round((t2.getTime() - t1.getTime()) / 60000);
      if (isNaN(diffMins) || diffMins < 0) return null;
      if (diffMins < 60) return `${diffMins} min`;
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    } catch {
      return null;
    }
  };

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
    market_sentiment: "Neutral",
    entry_time: "",
    exit_time: "",
  });

  const supabase = createClient();
  const loading = isLoading && trades.length === 0;

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const entryPrice = parseFloat(formData.entry_price);
      const exitPrice = parseFloat(formData.exit_price);
      const quantity = parseInt(formData.quantity) || 1;

      // Use API route for trade creation - this triggers automatic challenge check-in
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: formData.stock,
          direction: formData.direction,
          entry_price: entryPrice,
          exit_price: exitPrice,
          stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
          quantity,
          followed_plan: formData.followed_plan,
          emotion_before: formData.emotion_before,
          notes: formData.notes || null,
          market_sentiment: formData.market_sentiment || "Neutral",
          entry_time: formData.entry_time || null,
          exit_time: formData.exit_time || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to save trade:", data.error);
        alert(data.error || "Failed to save trade. Please try again.");
      } else {
        // Show challenge progress notification if applicable
        if (data.challengeProgress?.checked_in) {
          const cp = data.challengeProgress;
          if (cp.is_completed) {
            alert(`🎉 Challenge Completed! ${cp.message}`);
          } else {
            // Show subtle notification for daily progress
            console.log(`Challenge progress: ${cp.message}`);
          }
        }

        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.challenges(user.id) });
        queryClient.refetchQueries({ queryKey: queryKeys.trades(user.id) });
        queryClient.refetchQueries({ queryKey: queryKeys.dashboard(user.id) });
        queryClient.refetchQueries({ queryKey: queryKeys.challenges(user.id) });
        router.refresh();
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
          market_sentiment: "Neutral",
          entry_time: "",
          exit_time: "",
        });
      }
    } catch (err) {
      console.error("Error saving trade:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);

    const fData = new FormData();
    fData.append("file", file);

    try {
      const response = await fetch("/api/journal/import", {
        method: "POST",
        body: fData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to import trades. Please check your CSV format.");
      } else {
        setImportResult(data);
        queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
        queryClient.invalidateQueries({ queryKey: ["analytics", user.id] });
        queryClient.refetchQueries({ queryKey: queryKeys.trades(user.id) });
        queryClient.refetchQueries({ queryKey: queryKeys.dashboard(user.id) });
        queryClient.refetchQueries({ queryKey: ["analytics", user.id] });
        router.refresh();
      }
    } catch (err) {
      console.error("Error importing CSV:", err);
      alert("An error occurred during import.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleExportCSV = () => {
    window.location.href = `/api/journal/export?format=csv`;
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!user) return;
    setDeleting(tradeId);
    await supabase.from("trades").delete().eq("id", tradeId).eq("user_id", user.id);
    // Invalidate queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
    queryClient.refetchQueries({ queryKey: queryKeys.trades(user.id) });
    queryClient.refetchQueries({ queryKey: queryKeys.dashboard(user.id) });
    router.refresh();
    setDeleting(null);
  };

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeReflectionTrade) return;
    setSubmittingReflection(true);

    try {
      const response = await fetch("/api/journal/reflection-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeId: activeReflectionTrade.id,
          userReflection: userReflection,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to submit reflection. Please try again.");
      } else {
        // Invalidate queries to refetch updated trade data
        queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
        
        // Update local active trade view to immediately show AI feedback
        setActiveReflectionTrade(prev => prev ? {
          ...prev,
          reflection_text: userReflection,
          reflection_feedback: data.feedback
        } : null);
      }
    } catch (err) {
      console.error("Error submitting reflection:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmittingReflection(false);
    }
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
  const closedTrades = filteredTrades.filter((t) => t.exit_price !== null && t.exit_price !== undefined);
  const winRate = closedTrades.length
    ? Math.round(
        (closedTrades.filter((t) => t.pnl > 0).length / closedTrades.length) * 100
      )
    : 0;
  const rulesFollowed = filteredTrades.length
    ? Math.round(
        (filteredTrades.filter((t) => t.followed_plan).length / filteredTrades.length) * 100
      )
    : 0;

  const mistakeCost = filteredTrades
    .filter((t) => (t.pnl || 0) < 0 && t.mistakes && t.mistakes.length > 0)
    .reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0);

  const getTradeDurationMinutes = (trade: any): number | null => {
    if (trade.holding_duration_mins !== undefined && trade.holding_duration_mins !== null) {
      return Number(trade.holding_duration_mins);
    }
    if (trade.hold_time_minutes !== undefined && trade.hold_time_minutes !== null) {
      return Number(trade.hold_time_minutes);
    }
    const entry = trade.entry_time;
    const exit = trade.exit_time;
    if (!entry || !exit) return null;
    try {
      const parseTime = (t: string) => {
        if (t.includes("T") || t.includes("-")) return new Date(t);
        const [h, m, s] = t.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, s || 0, 0);
        return d;
      };
      const t1 = parseTime(entry);
      const t2 = parseTime(exit);
      const diffMins = Math.round((t2.getTime() - t1.getTime()) / 60000);
      return isNaN(diffMins) || diffMins < 0 ? null : diffMins;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Challenge Reminder Banner */}
      {activeChallenge && (
        <div className={`rounded-xl p-4 border ${
          hasJournaledToday 
            ? "bg-success/10 border-success/30" 
            : "bg-amber-500/10 border-amber-500/30"
        }`}>
          <div className="flex items-center gap-3">
            {hasJournaledToday ? (
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${hasJournaledToday ? "text-success" : "text-amber-600"}`}>
                {hasJournaledToday 
                  ? `✅ Challenge Day ${activeChallenge.current_day}/${activeChallenge.type} logged!` 
                  : `📝 Log a trade to track Day ${activeChallenge.current_day + 1}/${activeChallenge.type} of your challenge`
                }
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasJournaledToday 
                  ? "Great job! Keep up the discipline. Your progress is saved." 
                  : "Journal after every trading day to track your discipline challenge honestly."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 space-y-1 relative group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-destructive uppercase tracking-wider font-bold">
              Mistake Cost
            </p>
            <div className="relative cursor-pointer">
              <Info className="h-3.5 w-3.5 text-destructive/60 hover:text-destructive transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[9px] p-2 rounded-lg shadow-xl hidden group-hover:block z-50 pointer-events-none leading-normal normal-case font-normal">
                This is the total loss incurred on trades where you deviated from your trading plan or rules. Had you followed your rules, this loss could have been avoided.
              </div>
            </div>
          </div>
          <p className="text-lg font-bold font-heading font-mono leading-none text-destructive">
            ₹{mistakeCost.toLocaleString("en-IN")}
          </p>
          <div className="border-t border-destructive/10 pt-1 mt-1 text-[9px] text-destructive/80 font-mono flex justify-between">
            <span>Avoidable Loss:</span>
            <span className="font-semibold">₹{mistakeCost.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1 relative group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total Gross P&L
            </p>
            <div className="relative cursor-pointer">
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[9px] p-2 rounded-lg shadow-xl hidden group-hover:block z-50 pointer-events-none leading-normal normal-case font-normal">
                Projected Net P&L is a conservative estimate: 5% charges applied on winning sessions. Actual broker-reported charges may vary depending on Brokerage, STT, Exchange, GST, SEBI charges, and Stamp Duty.
              </div>
            </div>
          </div>
          <p
            className={`text-lg font-bold font-heading font-mono leading-none ${
              totalPnl >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {totalPnl >= 0 ? "+" : "−"}₹{Math.abs(totalPnl).toLocaleString("en-IN")}
          </p>
          {(() => {
            const estimatedCharges = totalPnl > 0 ? totalPnl * 0.05 : 0;
            const projectedNetPnl = totalPnl > 0 ? totalPnl * 0.95 : totalPnl;
            return (
              <div className="border-t border-border/40 pt-1 mt-1 text-[9px] text-muted-foreground space-y-0.5 font-mono">
                <div className="flex justify-between">
                  <span>Est. Charges:</span>
                  <span>₹{Math.round(estimatedCharges).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground/80">
                  <span>Proj. Net P&L:</span>
                  <span className={projectedNetPnl >= 0 ? "text-success/90" : "text-destructive/90"}>
                    {projectedNetPnl >= 0 ? "+" : "−"}₹{Math.round(Math.abs(projectedNetPnl)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            );
          })()}
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

      {/* Friction-Free Broker Trade Book Import Guide */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm mb-2">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-success/10 text-success mt-0.5 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Journal Your Trades in Under 60 Seconds
              <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-success/15 text-success tracking-wide uppercase">New</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export your Trade Book from your broker (Zerodha, FYERS, Upstox, Angel One, Dhan, etc.), copy the required columns, and paste into our simplified template. INTROSPECT automatically reconstructs your trades, matches execution times, and calculates Gross P&L, holding duration, and detects revenge trading or averaging down.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-[10px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 flex items-center justify-center rounded-full bg-muted text-[9px] text-foreground font-bold">1</span>
                Export Trade Book
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 flex items-center justify-center rounded-full bg-muted text-[9px] text-foreground font-bold">2</span>
                Copy 5 Columns (Symbol, Trade Type, Quantity, Price, Execution Time)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 flex items-center justify-center rounded-full bg-muted text-[9px] text-foreground font-bold">3</span>
                Paste & Upload Template
              </span>
            </div>
          </div>
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

           <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {!isProUser && (
              (() => {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth();
                const monthlyTradesCount = trades.filter((t: any) => {
                  if (!t.created_at) return false;
                  const date = new Date(t.created_at);
                  return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
                }).length;

                return (
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Free Plan: {monthlyTradesCount}/50 Monthly Trades
                  </span>
                );
              })()
            )}
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImportCSV}
              disabled={importing}
            />
            <button
              onClick={() => {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth();
                const monthlyTradesCount = trades.filter((t: any) => {
                  if (!t.created_at) return false;
                  const date = new Date(t.created_at);
                  return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
                }).length;

                if (!isProUser && monthlyTradesCount >= 50) {
                  setUpgradeFeature("Unlimited Trade Journaling (50 Monthly Trade Limit Reached)");
                  setShowUpgradeModal(true);
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {importing ? "Importing..." : "Import CSV"}
            </button>
            <a
              href="/api/journal/template"
              download="introspect_journal_template.csv"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              CSV Template
            </a>
            <button
              onClick={() => {
                if (!isProUser) {
                  setUpgradeFeature("Export to Excel & PDF Reports");
                  setShowUpgradeModal(true);
                  return;
                }
                handleExportCSV();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth();
                const monthlyTradesCount = trades.filter((t: any) => {
                  if (!t.created_at) return false;
                  const date = new Date(t.created_at);
                  return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
                }).length;

                if (!isProUser && monthlyTradesCount >= 50) {
                  setUpgradeFeature("Unlimited Trade Journaling (50 Monthly Trade Limit Reached)");
                  setShowUpgradeModal(true);
                  return;
                }
                setShowAddModal(true);
              }}
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
          <div className="col-span-2 text-right">Gross P&L</div>
          <div className="col-span-1">Emotion</div>
          <div className="col-span-1 text-center">Rules</div>
          <div className="col-span-2">Mistake / Observation</div>
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
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex flex-col gap-0.5">
                    <span>
                      {new Date(trade.created_at).toLocaleDateString("en-IN")} •{" "}
                      {new Date(trade.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {(trade.entry_time || trade.exit_time) && (
                      <span className="font-mono text-foreground/75 text-[9px]">
                        🕒 {trade.entry_time || "--:--"} - {trade.exit_time || "--:--"}
                      </span>
                    )}
                    {trade.entry_time && trade.exit_time && (
                      <span className="text-muted-foreground/60 text-[9px] block">
                        ⏱️ {getHoldingDuration(trade.entry_time, trade.exit_time)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="col-span-1">
                  <div className="flex flex-col gap-1 items-start">
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
                    {trade.market_sentiment && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                          trade.market_sentiment === "Bullish"
                            ? "bg-success/10 text-success"
                            : trade.market_sentiment === "Bearish"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {trade.market_sentiment}
                      </span>
                    )}
                  </div>
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
                  {trade.pnl >= 0 ? "+" : "−"}₹
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
                  {!isProUser ? (
                    <button
                      onClick={() => {
                        setUpgradeFeature("AI Mistake & Behavioral Diagnostics");
                        setShowUpgradeModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/15 border border-success/30 text-success hover:bg-success/20 text-[10px] font-bold transition-all cursor-pointer animate-pulse-slow"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Unlock Diagnostics</span>
                    </button>
                  ) : (() => {
                    // Find mistake tag from daily report for this trade
                    const reportMistake = mistakeTags.find(
                      (mt) => mt.stock.toLowerCase() === trade.stock.toLowerCase()
                    );
                    const isClean = reportMistake?.tag.startsWith("✅");
                    const mistakeText = reportMistake?.tag.replace(/^🔴\s*/, "").replace(/^✅\s*/, "");
                    const tradeObservations = trade.observations || [];
                    const renderingBadges = [];

                    if (reportMistake && !isClean) {
                      renderingBadges.push(
                        <span key="report-mistake" className="px-2 py-0.5 rounded border text-[10px] font-bold bg-destructive/10 text-destructive border-destructive/30">
                          {mistakeText?.split(" (")[0] || "Violation"}
                        </span>
                      );
                    } else if (reportMistake && isClean) {
                      renderingBadges.push(
                        <span key="report-clean" className="px-2 py-0.5 rounded border text-[10px] font-bold bg-success/10 text-success border-success/30">
                          Clean ✓
                        </span>
                      );
                    } else if (trade.mistakes && trade.mistakes.length > 0) {
                      trade.mistakes.forEach((m, idx) => {
                        const isReversed = (trade.reversals || []).some((r) => r.mistake_key === m);
                        if (isReversed) {
                          renderingBadges.push(
                            <span
                              key={`mistake-${idx}`}
                              title={(trade.reversals || []).find(r => r.mistake_key === m)?.reversal_comment}
                              className="px-2 py-0.5 rounded border text-[10px] font-bold bg-muted/40 text-muted-foreground border-border line-through opacity-60 cursor-help"
                            >
                              {formatMistakeLabel(m)} — Disputed
                            </span>
                          );
                        } else {
                          renderingBadges.push(
                            <span key={`mistake-${idx}`} className="inline-flex items-center gap-1 group/badge">
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                                  mistakeBadges[m] || "bg-destructive/10 text-destructive border-destructive/20"
                                }`}
                              >
                                {formatMistakeLabel(m)}
                              </span>
                              <button
                                title="Not a Mistake — dispute this detection"
                                onClick={() => handleOpenReversalModal(trade.id, m)}
                                className="opacity-0 group-hover/badge:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              >
                                <MessageSquareX className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        }
                      });
                    }

                    tradeObservations.forEach((obs, idx) => {
                      // Skip these — do not display at all (not even as observation)
                      // holding_losers_too_long, early_profit_booking: removed per client request
                      // data_integrity_buy_sell: was a false-positive on all losing long trades
                      if (
                        obs === "holding_losers_too_long" ||
                        obs === "early_profit_booking" ||
                        obs === "data_integrity_buy_sell"
                      ) return;

                      const badge = (
                        <span
                          className="px-2 py-0.5 rounded border text-[10px] font-bold bg-muted text-foreground border-border"
                        >
                          {formatMistakeLabel(obs)}
                        </span>
                      );
                      if (obs === "always_apply_sl") {
                        renderingBadges.push(
                          <Link key={`obs-${idx}`} href="/dashboard/calculator" title="Open Position Sizer">
                            {badge}
                          </Link>
                        );
                      } else {
                        renderingBadges.push(
                          <span key={`obs-${idx}`}>
                            {badge}
                          </span>
                        );
                      }
                    });

                    if (renderingBadges.length === 0) {
                      return <span className="text-xs text-muted-foreground/40">—</span>;
                    }

                    return <div className="flex flex-wrap gap-1">{renderingBadges}</div>;
                  })()}

                  {(() => {
                    const hasMistake = !trade.followed_plan || (trade.mistakes && trade.mistakes.length > 0) ||
                      (trade.observations && trade.observations.some((obs: string) => obs !== "holding_losers_too_long" && obs !== "early_profit_booking"));
                    if (!hasMistake) return null;
                    return (
                      <button
                        onClick={() => {
                          if (!isProUser) {
                            setUpgradeFeature("Interactive AI Coach");
                            setShowUpgradeModal(true);
                            return;
                          }
                          setActiveReflectionTrade(trade);
                          setUserReflection(trade.reflection_text || "");
                        }}
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                          trade.reflection_text
                            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                        }`}
                      >
                        {trade.reflection_text ? "💡 CBT" : "💬 AI Coach"}
                      </button>
                    );
                  })()}

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
                    {trade.pnl >= 0 ? "+" : "−"}₹
                    {Math.abs(trade.pnl).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>₹{trade.entry_price.toLocaleString("en-IN")} → ₹{(trade.exit_price || 0).toLocaleString("en-IN")}</span>
                  <span>•</span>
                  <span>{trade.quantity} qty</span>
                  {trade.market_sentiment && (
                    <>
                      <span>•</span>
                      <span className={`font-semibold ${
                        trade.market_sentiment === "Bullish" ? "text-success" :
                        trade.market_sentiment === "Bearish" ? "text-destructive" :
                        "text-muted-foreground"
                      }`}>
                        {trade.market_sentiment}
                      </span>
                    </>
                  )}
                </div>
                {(trade.entry_time || trade.exit_time) && (
                  <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground font-mono">
                    <span>🕒 {trade.entry_time || "--:--"} - {trade.exit_time || "--:--"}</span>
                    {trade.entry_time && trade.exit_time && (
                      <span>• ⏱️ {getHoldingDuration(trade.entry_time, trade.exit_time)}</span>
                    )}
                  </div>
                )}
                {/* Mobile mistake tag & AI Coach */}
                {(() => {
                  const reportMistake = mistakeTags.find(
                    (mt) => mt.stock.toLowerCase() === trade.stock.toLowerCase()
                  );
                  const isClean = reportMistake?.tag.startsWith("✅");
                  const mistakeText = reportMistake?.tag.replace(/^🔴\s*/, "").replace(/^✅\s*/, "");
                  const hasMistake = !trade.followed_plan || (trade.mistakes && trade.mistakes.length > 0) || (reportMistake && !isClean) ||
                    (trade.observations && trade.observations.some((obs: string) => obs !== "holding_losers_too_long" && obs !== "early_profit_booking"));

                  const tradeObservations = trade.observations || [];
                  const renderingBadges = [];

                  if (reportMistake && !isClean) {
                    renderingBadges.push(
                      <span key="report-mistake" className="px-2 py-0.5 rounded border text-[10px] font-bold bg-destructive/10 text-destructive border-destructive/30">
                        ⚠️ {mistakeText?.split(" (")[0] || "Violation"}
                      </span>
                    );
                  } else if (reportMistake && isClean) {
                    renderingBadges.push(
                      <span key="report-clean" className="px-2 py-0.5 rounded border text-[10px] font-bold bg-success/10 text-success border-success/30">
                        ✓ Clean Trade
                      </span>
                    );
                  } else if (trade.mistakes && trade.mistakes.length > 0) {
                    trade.mistakes.forEach((m, idx) => {
                      renderingBadges.push(
                        <span
                          key={`mistake-${idx}`}
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                            mistakeBadges[m] || "bg-muted text-foreground border-border"
                          }`}
                        >
                          {formatMistakeLabel(m)}
                        </span>
                      );
                    });
                  }

                  tradeObservations.forEach((obs, idx) => {
                    // Skip these — do not display at all (not even as observation)
                    // holding_losers_too_long, early_profit_booking: removed per client request
                    // data_integrity_buy_sell: was a false-positive on all losing long trades
                    if (
                      obs === "holding_losers_too_long" ||
                      obs === "early_profit_booking" ||
                      obs === "data_integrity_buy_sell"
                    ) return;

                    const badge = (
                      <span
                        className="px-2 py-0.5 rounded border text-[10px] font-bold bg-muted text-foreground border-border"
                      >
                        {formatMistakeLabel(obs)}
                      </span>
                    );
                    if (obs === "always_apply_sl") {
                      renderingBadges.push(
                        <Link key={`obs-${idx}`} href="/dashboard/calculator" title="Open Position Sizer">
                          {badge}
                        </Link>
                      );
                    } else {
                      renderingBadges.push(
                        <span key={`obs-${idx}`}>
                          {badge}
                        </span>
                      );
                    }
                  });

                  return (
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {!isProUser ? (
                          <button
                            onClick={() => {
                              setUpgradeFeature("AI Mistake & Behavioral Diagnostics");
                              setShowUpgradeModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-success/30 bg-success/10 text-success text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            <span>Unlock Diagnostics</span>
                          </button>
                        ) : (
                          renderingBadges
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {hasMistake && (
                          <button
                            onClick={() => {
                              if (!isProUser) {
                                setUpgradeFeature("Interactive AI Coach");
                                setShowUpgradeModal(true);
                                return;
                              }
                              setActiveReflectionTrade(trade);
                              setUserReflection(trade.reflection_text || "");
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                              trade.reflection_text
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }`}
                          >
                            {trade.reflection_text ? "💡 View CBT" : "💬 AI Coach"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="p-1 rounded hover:bg-destructive/10 transition-all text-destructive cursor-pointer"
                        >
                          {deleting === trade.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
          {filteredTrades.length === 0 && (
            <div className="text-center py-12">
              {dateFilter === "today" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No trades logged today
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Log Today&apos;s Trade & Get Discipline Score
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No trades found for the selected filter. Click &quot;Log Trade&quot; to record an entry.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Result Summary Modal */}
      <AnimatePresence>
        {importResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <button
                onClick={() => setImportResult(null)}
                className="absolute right-4 top-4 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="font-heading text-base font-bold">Import & Analysis Summary</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Executions</span>
                    <span className="text-lg font-bold">{importResult.processedCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-success/[0.04] border border-success/15">
                    <span className="text-[10px] text-success uppercase font-bold block">Reconstructed Trades</span>
                    <span className="text-lg font-bold text-success">{importResult.completedCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                    <span className="text-[10px] text-amber-500 uppercase font-bold block">Open Positions</span>
                    <span className="text-lg font-bold text-amber-500">{importResult.openPositionsCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Skipped Duplicates</span>
                    <span className="text-lg font-bold text-muted-foreground">{importResult.duplicatesCount}</span>
                  </div>
                </div>

                {/* Open Positions List */}
                {importResult.openPositions && importResult.openPositions.length > 0 && (
                  <div className="space-y-1.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-3.5">
                    <span className="text-[10px] font-bold text-amber-500 uppercase block tracking-wider">Open Positions (Not Journaled)</span>
                    <div className="divide-y divide-amber-500/10 max-h-[120px] overflow-y-auto pr-1 space-y-1">
                      {importResult.openPositions.map((op: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 first:pt-0">
                          <div>
                            <span className="font-semibold text-foreground">{op.symbol}</span>
                            <span className={`ml-2 px-1.5 py-0.2 rounded text-[8px] font-bold ${op.direction === "long" ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>{op.direction === "long" ? "LONG" : "SHORT"}</span>
                          </div>
                          <span className="font-mono text-muted-foreground text-[11px]">{op.netQty} qty @ ₹{op.avgPrice.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors/Ignored List */}
                {importResult.errors && importResult.errors.filter((e: any) => e.rowNum > 0).length > 0 && (
                  <div className="space-y-1.5 rounded-xl border border-destructive/20 bg-destructive/[0.02] p-3.5">
                    <span className="text-[10px] font-bold text-destructive uppercase block tracking-wider">Ignored / Invalid Records</span>
                    <div className="divide-y divide-destructive/10 max-h-[120px] overflow-y-auto pr-1">
                      {importResult.errors.filter((e: any) => e.rowNum > 0).map((err: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 first:pt-0">
                          <span className="text-muted-foreground">Row {err.rowNum} ({err.symbol})</span>
                          <span className="text-destructive font-medium">{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/40 pt-3 flex justify-end">
                <button
                  onClick={() => setImportResult(null)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block truncate">Entry Time</label>
                      <input
                        type="time"
                        value={formData.entry_time}
                        onChange={(e) => setFormData((p) => ({ ...p, entry_time: e.target.value }))}
                        className="w-full px-2 py-2 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block truncate">Exit Time</label>
                      <input
                        type="time"
                        value={formData.exit_time}
                        onChange={(e) => setFormData((p) => ({ ...p, exit_time: e.target.value }))}
                        className="w-full px-2 py-2 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all cursor-pointer"
                      />
                    </div>
                  </div>
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
                      Market Sentiment
                    </label>
                    <div className="flex gap-2">
                      {["Bullish", "Bearish", "Neutral"].map((sentiment) => (
                        <button
                          key={sentiment}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, market_sentiment: sentiment }))}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                            formData.market_sentiment === sentiment
                              ? sentiment === "Bullish"
                                ? "border-success bg-success/[0.06] text-success"
                                : sentiment === "Bearish"
                                ? "border-destructive bg-destructive/[0.06] text-destructive"
                                : "border-muted-foreground bg-muted text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted/30"
                          }`}
                        >
                          {sentiment}
                        </button>
                      ))}
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

      {/* AI Reflection Coach Modal */}
      <AnimatePresence>
        {activeReflectionTrade && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (!submittingReflection) {
                  setActiveReflectionTrade(null);
                  setUserReflection("");
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      INTROSPECT™ Reflection Coach
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Cognitive Behavioral Therapy (CBT)
                    </p>
                  </div>
                </div>
                <button
                  disabled={submittingReflection}
                  onClick={() => {
                    setActiveReflectionTrade(null);
                    setUserReflection("");
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-muted/30 rounded-xl p-3 text-xs border border-border/50">
                <span className="font-semibold block text-foreground mb-1">
                  Trade details:
                </span>
                <span className="font-mono text-muted-foreground">
                  {activeReflectionTrade.stock} • {activeReflectionTrade.direction === "long" ? "LONG" : "SHORT"} • P&L: {activeReflectionTrade.pnl >= 0 ? "+" : "−"}₹{Math.abs(activeReflectionTrade.pnl).toLocaleString("en-IN")}
                </span>
              </div>

              {activeReflectionTrade.reflection_feedback ? (
                // Show existing reflection and feedback
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Your Reflection
                    </span>
                    <div className="p-3 bg-muted/40 rounded-xl text-sm italic text-foreground leading-relaxed border border-border/40">
                      "{activeReflectionTrade.reflection_text}"
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Coach Feedback
                    </div>
                    <div className="p-4 bg-primary/[0.03] border border-primary/20 rounded-xl text-sm text-foreground leading-relaxed">
                      {activeReflectionTrade.reflection_feedback}
                    </div>
                    {(activeReflectionTrade.observations?.includes("holding_losers_too_long") ||
                      activeReflectionTrade.observations?.includes("always_apply_sl") ||
                      activeReflectionTrade.mistakes?.includes("no_stop_loss") ||
                      activeReflectionTrade.mistakes?.includes("always_apply_sl")) && (
                      <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-primary">Need help managing risk?</p>
                          <p className="text-[10px] text-muted-foreground">Use our Position Sizer to compute optimal quantity & protect your capital.</p>
                        </div>
                        <Link href="/dashboard/calculator">
                          <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition-colors cursor-pointer shrink-0">
                            Open Sizer
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      // Allow re-reflecting if desired
                      setActiveReflectionTrade(prev => prev ? {
                        ...prev,
                        reflection_text: null,
                        reflection_feedback: null
                      } : null);
                      setUserReflection("");
                    }}
                    className="w-full py-2.5 rounded-xl border border-border hover:bg-muted/50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reflect Again
                  </button>
                </div>
              ) : (
                // Prompt user to write reflection
                <form onSubmit={handleSubmitReflection} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
                      <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">CBT Trigger Analysis:</strong> You logged a mistake on this trade. To construct a cognitive reframe and avoid repeating it, explain: What triggered the urge to deviate from your plan? What emotions or physical sensations were you experiencing right before clicking buy/sell?
                      </p>
                    </div>

                    <textarea
                      rows={4}
                      required
                      disabled={submittingReflection}
                      value={userReflection}
                      onChange={(e) => setUserReflection(e.target.value)}
                      placeholder="e.g., I saw the price moving fast and felt anxious about missing the move. I entered without waiting for my 5-minute candle to close..."
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm resize-none focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReflection || !userReflection.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl shadow-lg shadow-primary/15 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submittingReflection ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing triggers...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analyze Trigger & Get CBT Feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mistake Reversal Modal ── */}
      <AnimatePresence>
        {reversalModal.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => !reversalModal.submitting && setReversalModal((p) => ({ ...p, open: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                      <MessageSquareX className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Dispute Detection</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Flagged as: <span className="font-semibold text-destructive">{reversalModal.mistakeLabel}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => !reversalModal.submitting && setReversalModal((p) => ({ ...p, open: false }))}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                  <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If this detection is incorrect, explain why. Your feedback helps improve the system.
                    The flag will remain visible but marked as <span className="font-semibold text-foreground">Disputed</span>.
                  </p>
                </div>

                {/* Comment input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Why is this not a mistake? <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    disabled={reversalModal.submitting}
                    value={reversalModal.comment}
                    onChange={(e) => setReversalModal((p) => ({ ...p, comment: e.target.value, error: "" }))}
                    placeholder="e.g., The trade was within my planned risk limit and I followed my setup rules. The system incorrectly flagged it because..."
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm resize-none focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all leading-relaxed disabled:opacity-60"
                  />
                  <div className="flex items-center justify-between">
                    {reversalModal.error ? (
                      <p className="text-xs text-destructive">{reversalModal.error}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-muted-foreground/60 ml-auto">{reversalModal.comment.length}/500</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => !reversalModal.submitting && setReversalModal((p) => ({ ...p, open: false }))}
                    disabled={reversalModal.submitting}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReversal}
                    disabled={reversalModal.submitting || reversalModal.comment.trim().length < 5}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-500/90 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {reversalModal.submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="h-4 w-4" />
                        Submit Dispute
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeature}
      />
    </div>
  );
}
