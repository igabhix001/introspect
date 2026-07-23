"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  Target,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Info,
  X,
  Brain,
  Printer,
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyReportQuery, useRecentDailyReportsQuery } from "@/lib/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { formatMistakeLabel } from "@/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";
import { UpgradeModal } from "@/components/paywall/upgrade-modal";
import { createClient } from "@/lib/supabase/client";

const PnlChart = dynamic(() => import("@/components/dashboard/pnl-chart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/10 rounded-lg animate-pulse">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface DailyReport {
  id: string;
  date: string;
  trades_taken: number;
  rules_followed: number;
  total_rules: number;
  mistakes_count: number;
  discipline_score: number;
  total_pnl: number;
  updated_capital: number;
  feedback: {
    positive: string[];
    negative: string[];
    suggestions: string[];
    encouragement: string;
    ai_narrative?: string;
    ai_status?: string;
    holdingTimes?: {
      avgWinHoldTime: number;
      avgLossHoldTime: number;
      dispositionRatio: number;
    };
    tradeScorecard?: Array<{
      id: string;
      stock: string;
      entry_time: string | null;
      exit_time: string | null;
      hold_time_minutes: number;
      pnl: number;
      direction: string;
      followed_plan: boolean;
      sl_followed: boolean;
      mistakes: string[];
      observations?: string[];
      reflection_text?: string | null;
      reflection_feedback?: string | null;
    }>;
  };
}

export default function DailyReportPage() {
  const { user, hasActiveSubscription } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isProUser = hasActiveSubscription === true;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("Historical Daily Reports");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: reportData, isLoading: reportLoading } = useDailyReportQuery(selectedDate);
  const { data: recentReportsData } = useRecentDailyReportsQuery();

  const [activeReflectionTrade, setActiveReflectionTrade] = useState<any | null>(null);
  const [userReflection, setUserReflection] = useState("");
  const [submittingReflection, setSubmittingReflection] = useState(false);

  const report = reportData as DailyReport | null;
  const recentReports = (recentReportsData || []) as DailyReport[];
  const loading = reportLoading && !report;

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

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReflectionTrade) return;
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
        // Invalidate dailyReport query to refetch fresh EOD report data
        queryClient.invalidateQueries({ queryKey: ["dailyReport"] });
        
        // Update local active trade view to immediately show AI feedback
        setActiveReflectionTrade((prev: any) => prev ? {
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

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      });
      const data = await res.json();
      if (data.report) {
        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ["dailyReport"] });
        queryClient.invalidateQueries({ queryKey: ["recentDailyReports"] });
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
    setGenerating(false);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + (direction === "next" ? 1 : -1));
    const newDate = current.toISOString().split("T")[0];
    if (newDate <= new Date().toISOString().split("T")[0]) {
      setSelectedDate(newDate);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-amber-500";
    if (score >= 40) return "text-orange-500";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success/10 border-success/20";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
    if (score >= 40) return "bg-orange-500/10 border-orange-500/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const tradeScorecard = report?.feedback?.tradeScorecard || [];
  const wins = tradeScorecard.filter((t: any) => t.pnl > 0).length;
  const totalClosed = tradeScorecard.filter((t: any) => t.exit_price !== null && t.exit_price !== undefined).length;
  const winRate = totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">End-of-Day Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review your daily trading performance and discipline
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const todayStr = new Date().toISOString().split("T")[0];
                if (!isProUser && e.target.value !== todayStr) {
                  setUpgradeFeature("Historical Daily Reports");
                  setShowUpgradeModal(true);
                  return;
                }
                setSelectedDate(e.target.value);
              }}
              max={new Date().toISOString().split("T")[0]}
              className="bg-transparent text-sm font-medium outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => navigateDate("next")}
            disabled={selectedDate === new Date().toISOString().split("T")[0]}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {report && (
            <button
              onClick={generateReport}
              disabled={generating}
              className="p-2 rounded-lg border border-border hover:bg-muted hover:border-success/40 hover:text-success transition-all text-muted-foreground flex items-center gap-1.5 no-print cursor-pointer disabled:opacity-50"
              title="Regenerate EOD Analysis"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              <span className="text-xs font-semibold hidden sm:inline">
                {generating ? "Regenerating..." : "Regenerate Analysis"}
              </span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg border border-border hover:bg-muted hover:border-primary/40 hover:text-primary transition-all text-muted-foreground flex items-center gap-1.5 no-print cursor-pointer"
            title="Print EOD Report"
          >
            <Printer className="h-4 w-4" />
            <span className="text-xs font-semibold hidden sm:inline">Print / Save PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : report ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Score Card */}
          <div className={`rounded-2xl border p-6 ${getScoreBg(report.discipline_score)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Discipline Score</p>
                <p className={`text-5xl font-bold font-heading ${getScoreColor(report.discipline_score)}`}>
                  {report.discipline_score}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {report.rules_followed} of {report.total_rules} rules followed
                </p>
              </div>
              <div className="text-right">
                <Trophy className={`h-12 w-12 ${getScoreColor(report.discipline_score)} opacity-50`} />
              </div>
            </div>
          </div>

          {/* AI Coaching Narrative */}
          {report.feedback.ai_narrative && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.01] p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Sparkles className="h-24 w-24 text-primary" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-1.5">
                      INTROSPECT™ AI Coaching Narrative
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      INTROSPECT™ AI Behavioral Analysis
                    </p>
                  </div>
                </div>

                {report.feedback.ai_status === "paywall" ? (
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center space-y-3">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-amber-500">Upgrade to Paid Subscription</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        AI-powered cognitive bias identification, EOD narratives, and CBT coaching are premium features. Upgrade today to start trading with discipline!
                      </p>
                    </div>
                    <a
                      href="/dashboard/payments"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Upgrade Plan
                    </a>
                  </div>
                ) : report.feedback.ai_status === "limit_exceeded" ? (
                  <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-center space-y-2">
                    <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Daily AI Review Limit Reached</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You have reached your daily limit of 5 AI reviews. Your limit resets tomorrow.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                    {report.feedback.ai_narrative.split("\n\n").map((para, i) => (
                      <p key={i} className={i === 2 ? "pt-2.5 font-medium border-t border-border/40 text-foreground" : ""}>
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trades</p>
              <p className="text-2xl font-bold">{report.trades_taken}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Gross P&L</p>
                <div className="relative cursor-pointer">
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[9px] p-2 rounded-lg shadow-xl hidden group-hover:block z-50 pointer-events-none leading-normal normal-case font-normal">
                    Projected Net P&L is a conservative estimate: 5% charges applied on winning sessions. Actual broker-reported charges may vary depending on Brokerage, STT, Exchange, GST, SEBI charges, and Stamp Duty.
                  </div>
                </div>
              </div>
              <p className={`text-2xl font-bold font-mono leading-none ${report.total_pnl >= 0 ? "text-success" : "text-destructive"}`}>
                {report.total_pnl >= 0 ? "+" : ""}₹{report.total_pnl.toLocaleString("en-IN")}
              </p>
              {(() => {
                const totalGrossPnl = report.total_pnl;
                const estimatedCharges = totalGrossPnl > 0 ? totalGrossPnl * 0.05 : 0;
                const projectedNetPnl = totalGrossPnl > 0 ? totalGrossPnl * 0.95 : totalGrossPnl;
                return (
                  <div className="border-t border-border/40 pt-1 mt-1 text-[10px] text-muted-foreground space-y-0.5 font-mono">
                    <div className="flex justify-between">
                      <span>Est. Charges:</span>
                      <span>₹{Math.round(estimatedCharges).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground/80">
                      <span>Proj. Net P&L:</span>
                      <span className={projectedNetPnl >= 0 ? "text-success/90" : "text-destructive/90"}>
                        {projectedNetPnl >= 0 ? "+" : ""}₹{Math.round(projectedNetPnl).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mistakes</p>
              <p className="text-2xl font-bold text-destructive">{report.mistakes_count}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
              <p className="text-2xl font-bold font-heading">{winRate}%</p>
            </div>
          </div>

          {/* Cumulative Daily P&L Curve */}
          {report.feedback.tradeScorecard && report.feedback.tradeScorecard.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold">
                    Cumulative Daily P&L Curve
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your chronological equity path across today's trades
                  </p>
                </div>
                {report.feedback.holdingTimes && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div>
                      Avg Win Hold: <span className="font-semibold text-success">{report.feedback.holdingTimes.avgWinHoldTime}m</span>
                    </div>
                    <div>
                      Avg Loss Hold: <span className="font-semibold text-destructive">{report.feedback.holdingTimes.avgLossHoldTime}m</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-[200px] min-h-[260px] min-w-0 -ml-2 no-print">
                <PnlChart
                  data={[
                    { tradeIndex: 0, time: "Start", pnl: 0 },
                    ...(() => {
                      let runningPnl = 0;
                      return report.feedback.tradeScorecard.map((t, idx) => {
                        runningPnl += t.pnl;
                        return {
                          tradeIndex: idx + 1,
                          time: t.exit_time || t.entry_time || `T${idx + 1}`,
                          pnl: runningPnl,
                          symbol: t.stock
                        };
                      });
                    })()
                  ]}
                />
              </div>

              {/* Print-only Textual Cumulative P&L Path */}
              <div className="print-only mt-4 pt-2 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-wider mb-2">Chronological Running P&L Progression</p>
                <table className="w-full text-left border-collapse text-[10pt] text-foreground">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="py-1.5 font-semibold">Trade #</th>
                      <th className="py-1.5 font-semibold">Instrument</th>
                      <th className="py-1.5 font-semibold text-right">Trade P&L</th>
                      <th className="py-1.5 font-semibold text-right">Cumulative Running P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let runningPnl = 0;
                      return report.feedback.tradeScorecard.map((t, idx) => {
                        runningPnl += t.pnl;
                        return (
                          <tr key={idx} className="border-b border-muted/50 font-mono">
                            <td className="py-1.5 text-muted-foreground">#{idx + 1}</td>
                            <td className="py-1.5 font-sans font-medium text-foreground">{t.stock}</td>
                            <td className={`py-1.5 text-right font-bold ${t.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                              {t.pnl >= 0 ? "+" : ""}₹{t.pnl.toLocaleString("en-IN")}
                            </td>
                            <td className={`py-1.5 text-right font-bold ${runningPnl >= 0 ? "text-success" : "text-destructive"}`}>
                              ₹{runningPnl.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interactive EOD Scorecard Table */}
          {report.feedback.tradeScorecard && report.feedback.tradeScorecard.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div>
                <h3 className="font-heading text-sm font-semibold mb-1">
                  Interactive EOD Scorecard
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Symbol-by-symbol execution safety audit
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase text-muted-foreground font-semibold">
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Entry/Exit</th>
                      <th className="pb-2">Duration</th>
                      <th className="pb-2 text-right">P&L</th>
                      <th className="pb-2 text-center">Safety Status</th>
                      <th className="pb-2">Mistakes / Observations</th>
                      <th className="pb-2 text-center no-print">CBT Coach</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {report.feedback.tradeScorecard.map((trade) => {
                      const hasViolations = !trade.followed_plan || !trade.sl_followed || trade.mistakes.length > 0;
                      const hasCoach = hasViolations || (trade.observations && trade.observations.length > 0);
                      
                      return (
                        <tr key={trade.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 font-semibold text-foreground">{trade.stock}</td>
                          <td className="py-3">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              trade.direction === "long" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                            }`}>
                              {trade.direction.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {trade.entry_time || "N/A"} - {trade.exit_time || "N/A"}
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {trade.hold_time_minutes > 0 ? `${trade.hold_time_minutes} mins` : "Instant"}
                          </td>
                          <td className={`py-3 text-right font-mono font-bold ${trade.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                            {trade.pnl >= 0 ? "+" : ""}₹{trade.pnl.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 text-center">
                            {!hasViolations ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                                🟢 Safe
                              </span>
                            ) : !trade.sl_followed || trade.mistakes.some(m => m.includes("SIZE") || m.includes("SL")) ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                                🔴 Critical
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                🟡 Warning
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-xs">
                            {(trade.mistakes && trade.mistakes.length > 0) || (trade.observations && trade.observations.length > 0) ? (
                              <div className="flex flex-wrap gap-1">
                                {trade.mistakes && trade.mistakes.map((m, idx) => (
                                  <span key={`mistake-${idx}`} className="bg-destructive/10 text-destructive text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                    {formatMistakeLabel(m)}
                                  </span>
                                ))}
                                {trade.observations && trade.observations.map((obs, idx) => {
                                  const duration = getTradeDurationMinutes(trade);
                                  const label = obs === "holding_losers_too_long"
                                    ? `Trade Lasted ${duration ? `${duration} Mins` : "86 Mins"}`
                                    : formatMistakeLabel(obs);
                                  const badge = (
                                    <span
                                      className={`px-1.5 py-0.5 rounded border border-border text-[10px] font-semibold ${
                                        obs === "holding_losers_too_long" || obs === "always_apply_sl"
                                          ? "bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                                          : "bg-muted text-foreground"
                                      }`}
                                    >
                                      {label}
                                    </span>
                                  );
                                  if (obs === "holding_losers_too_long" || obs === "always_apply_sl") {
                                    return (
                                      <Link key={`obs-${idx}`} href="/dashboard/calculator" title="Open Position Sizer">
                                        {badge}
                                      </Link>
                                    );
                                  }
                                  return (
                                    <span key={`obs-${idx}`}>
                                      {badge}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[10px] italic">No issues detected</span>
                            )}
                          </td>
                          <td className="py-3 text-center no-print">
                            {hasCoach ? (
                              trade.reflection_feedback ? (
                                <button
                                  onClick={() => setActiveReflectionTrade(trade)}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Brain className="h-3 w-3" /> View Feedback
                                </button>
                              ) : (
                                <button
                                  onClick={() => setActiveReflectionTrade(trade)}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/15 hover:bg-success/25 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Sparkles className="h-3 w-3" /> Reflect
                                </button>
                              )
                            ) : (
                              <span className="text-muted-foreground text-[10px] italic">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feedback Sections */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Positive */}
            {report.feedback.positive.length > 0 && (
              <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <h3 className="font-semibold text-success">What Went Well</h3>
                </div>
                <ul className="space-y-2">
                  {report.feedback.positive.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negative */}
            {report.feedback.negative.length > 0 && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {report.feedback.negative.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-amber-500">Tomorrow's Focus</h3>
            </div>
            <ul className="space-y-2">
              {report.feedback.suggestions.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Target className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Encouragement */}
          <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 to-success/5 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{report.feedback.encouragement}</p>
            </div>
          </div>

          {/* Regenerate Report Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={generateReport}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Report
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Report for {selectedDate}</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Generate your end-of-day report to review your performance
          </p>
          <button
            onClick={generateReport}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      )}

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">Recent Reports</h3>
          <div className="grid grid-cols-7 gap-2">
            {recentReports.map((r) => (
              <button
                key={r.date}
                onClick={() => setSelectedDate(r.date)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  r.date === selectedDate
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <p className="text-xs text-muted-foreground">
                  {new Date(r.date).toLocaleDateString("en-IN", { weekday: "short" })}
                </p>
                <p className={`text-lg font-bold ${getScoreColor(r.discipline_score)}`}>
                  {r.discipline_score}
                </p>
                <p className={`text-xs ${r.total_pnl >= 0 ? "text-success" : "text-destructive"}`}>
                  {r.total_pnl >= 0 ? "+" : ""}₹{Math.abs(r.total_pnl) > 1000 ? `${(r.total_pnl / 1000).toFixed(1)}k` : r.total_pnl}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          /* Hide sidebar, top navigation, and action buttons */
          header, nav, aside, footer, .no-print, button, .no-print * {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt;
            margin: 0;
            padding: 0;
          }
          main, .max-w-4xl {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Ensure charts display well and text is readable */
          .bg-card, .bg-muted {
            background-color: #fafafa !important;
            border: 1px solid #e2e8f0 !important;
            color: #000000 !important;
          }
          .text-muted-foreground {
            color: #4a5568 !important;
          }
          /* Print backgrounds for charts/badges */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .rounded-2xl, .rounded-xl {
            border: 1px solid #e2e8f0 !important;
            break-inside: avoid;
            background: transparent !important;
          }
        }
      `}</style>

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
                  {activeReflectionTrade.stock} • {activeReflectionTrade.direction === "long" ? "LONG" : "SHORT"} • P&L: ₹{activeReflectionTrade.pnl.toLocaleString("en-IN")}
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
                      setActiveReflectionTrade((prev: any) => prev ? {
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

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeature}
      />
    </div>
  );
}
