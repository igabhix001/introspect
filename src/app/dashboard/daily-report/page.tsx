"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyReportQuery, useRecentDailyReportsQuery } from "@/lib/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";

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
  };
}

export default function DailyReportPage() {
  const { loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);

  const { data: reportData, isLoading: reportLoading } = useDailyReportQuery(selectedDate);
  const { data: recentReportsData } = useRecentDailyReportsQuery();

  const report = reportData as DailyReport | null;
  const recentReports = (recentReportsData || []) as DailyReport[];
  const loading = reportLoading && !report;

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="bg-transparent text-sm font-medium outline-none"
            />
          </div>
          <button
            onClick={() => navigateDate("next")}
            disabled={selectedDate === new Date().toISOString().split("T")[0]}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trades</p>
              <p className="text-2xl font-bold">{report.trades_taken}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">P&L</p>
              <p className={`text-2xl font-bold ${report.total_pnl >= 0 ? "text-success" : "text-destructive"}`}>
                {report.total_pnl >= 0 ? "+" : ""}₹{report.total_pnl.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mistakes</p>
              <p className="text-2xl font-bold text-destructive">{report.mistakes_count}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Capital</p>
              <p className="text-2xl font-bold">₹{report.updated_capital.toLocaleString("en-IN")}</p>
            </div>
          </div>

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
    </div>
  );
}
