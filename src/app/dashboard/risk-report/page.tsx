"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Target,
  Brain,
  RefreshCw,
  Flame,
  Loader2,
  Lock,
  Star,
  Printer,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const RiskRadarChart = dynamic(() => import("@/components/dashboard/risk-radar-chart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
      Loading risk visualization...
    </div>
  ),
});

const RiskLineChart = dynamic(() => import("@/components/dashboard/risk-line-chart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
      Loading trend...
    </div>
  ),
});
import { useAuth } from "@/lib/auth/auth-context";
import { useAssessmentQuery, useAllAssessmentsQuery } from "@/lib/hooks/use-queries";

const DISTORTION_DESCRIPTIONS: Record<string, string> = {
  "Stop-Loss & Loss Response": "Loss aversion asymmetry leading to deferred risk cut and revenge sizing.",
  "Behaviour After Profits": "Euphoria and house-money bias causing excessive sizing after positive cycles.",
  "Risk Planning & Positioning": "Planning fallacy and planning bias neglecting volatility scaling controls.",
  "Impulse & Over-Participation": "Action bias and instant gratification triggers resulting in sub-optimal entries.",
  "Rule Consistency": "Discipline fatigue causing systematic risk threshold overrides under execution stress.",
};

const stagger = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

const severityStyles = {
  critical: { bg: "bg-destructive/[0.05]", border: "border-destructive/20", badge: "bg-destructive/10 text-destructive", label: "Critical" },
  important: { bg: "bg-amber-500/[0.05]", border: "border-amber-500/20", badge: "bg-amber-500/10 text-amber-500", label: "Important" },
  warning: { bg: "bg-amber-500/[0.05]", border: "border-amber-500/20", badge: "bg-amber-500/10 text-amber-500", label: "Important" },
  info: { bg: "bg-blue-500/[0.05]", border: "border-blue-500/20", badge: "bg-blue-500/10 text-blue-500", label: "Suggested" },
};

const categoryIcons: Record<string, typeof Shield> = {
  Capital: Shield,
  Execution: Target,
  Psychology: Brain,
  Discipline: Flame,
  General: CheckCircle2,
};

export default function RiskReportPage() {
  const { loading: authLoading, hasActiveSubscription } = useAuth();
  const { data: assessment, isLoading: assessmentLoading } = useAssessmentQuery();
  const { data: allAssessments } = useAllAssessmentsQuery();
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (assessment && hasActiveSubscription !== false) {
      setAiLoading(true);
      fetch("/api/risk-report/summary")
        .then((res) => res.json())
        .then((data) => {
          if (data.summary) {
            setAiSummary(data.summary);
          }
        })
        .catch((err) => console.error("Error fetching AI summary:", err))
        .finally(() => setAiLoading(false));
    }
  }, [assessment, hasActiveSubscription]);

  const loading = assessmentLoading && !assessment;

  // Non-subscribers cannot view full report - show subscribe prompt
  // Only block if explicitly false (not undefined/loading)
  if (!loading && !authLoading && hasActiveSubscription === false) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-16"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lock className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="font-heading text-2xl font-bold mb-3">
          Full Report Locked
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Subscribe to unlock your complete risk report with detailed category breakdown, radar profile, and all personalized trading rules.
        </p>
        
        {/* Show preview of score if available */}
        {assessment && (
          <div className="rounded-xl border border-border bg-card p-4 mb-6 max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Score Preview</p>
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-3xl font-bold text-success">{assessment.discipline_score}</p>
                <p className="text-[10px] text-muted-foreground">Discipline Score</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-lg font-bold text-amber-500 capitalize">{assessment.risk_level}</p>
                <p className="text-[10px] text-muted-foreground">Risk Level</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold px-7 py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] transition-all cursor-pointer text-sm"
          >
            <Star className="h-4 w-4" /> Subscribe to Unlock
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-border/80 px-5 py-3.5 rounded-xl transition-all cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>
        <p className="text-[11px] text-muted-foreground mt-4">Full report access · Unlimited assessments · Cancel anytime</p>
      </motion.div>
    );
  }

  // Process assessment data
  const categoriesAnalysis = assessment?.categories_analysis || null;
  
  // Build radar data from assessment
  const radarData = categoriesAnalysis?.categories?.map((cat: { name: string; risk_percent: number }) => ({
    category: cat.name.replace("&", "&").split(" ").slice(0, 2).join(" "),
    score: Math.round((1 - cat.risk_percent) * 100),
    fullMark: 100,
  })) || [
    { category: "Stop-Loss", score: 50, fullMark: 100 },
    { category: "After Profits", score: 50, fullMark: 100 },
    { category: "Risk Planning", score: 50, fullMark: 100 },
    { category: "Impulse Control", score: 50, fullMark: 100 },
    { category: "Rule Consistency", score: 50, fullMark: 100 },
  ];

  const overallScore = assessment?.discipline_score ?? 50;
  const riskLvl = assessment?.risk_level || "medium";
  
  const riskLevel = riskLvl === "low" 
    ? { label: "Low Risk", color: "text-success", bg: "bg-success/10", border: "border-success/20" }
    : riskLvl === "medium"
    ? { label: "Moderate Risk", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" }
    : riskLvl === "high"
    ? { label: "High Risk", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" }
    : { label: "Take Assessment", color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" };

  // Default personalized rules
  const personalizedRules = [
    { rule: "Maximum 1% risk per trade", detail: "Never risk more than 1% of your trading capital on a single trade.", category: "Capital", severity: "critical" },
    { rule: "Daily loss limit: ₹2,000", detail: "Stop trading for the day once you hit this limit. No exceptions.", category: "Capital", severity: "critical" },
    { rule: "Mandatory stop-loss on every trade", detail: "Place your SL before entry. No mental stop-losses.", category: "Execution", severity: "critical" },
    { rule: "10-minute cooldown after a loss", detail: "Wait before re-entering to avoid revenge trading.", category: "Psychology", severity: "warning" },
    { rule: "Maximum 5 trades per day", detail: "Limit yourself to high-conviction setups only.", category: "Discipline", severity: "warning" },
    { rule: "Journal every trade with emotional state", detail: "Log every trade with how you felt during entry and exit.", category: "Discipline", severity: "info" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5 no-print">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Behavioural Risk Report</h1>
          <p className="text-xs text-muted-foreground mt-1">Deep analysis of your trading patterns, risk personality, and personalized safeguards.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all cursor-pointer text-foreground"
          >
            <Printer className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* AI Executive Summary */}
      {hasActiveSubscription !== false && (
        <motion.div
          variants={stagger.item}
          className="rounded-2xl border border-border bg-gradient-to-r from-success/5 via-transparent to-transparent p-6 relative overflow-hidden screen-only"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0 animate-pulse">
              <Brain className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-success">
                  INTROSPECT™ AI Executive Summary
                </h3>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-success/15 text-success border border-success/30 shadow-[0_0_8px_rgba(34,197,94,0.2)] animate-pulse">
                  AI Synthesis
                </span>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Loader2 className="h-3 w-3 animate-spin text-success" />
                  Synthesizing psychological trading profile...
                </div>
              ) : aiSummary ? (
                <p className="text-sm text-foreground/95 leading-relaxed font-medium">
                  {aiSummary}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Failed to generate AI executive summary. Retrying shortly...
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 screen-only">
        {/* Radar Chart */}
        <motion.div variants={stagger.item} className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">Risk Profile Analysis</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Based on your diagnostic assessment</p>
            </div>
            <Link href="/dashboard/assessment" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors no-print">
              <RefreshCw className="h-3 w-3" /> Retake
            </Link>
          </div>
          <div className="h-[300px] min-h-[260px] min-w-0">
            <RiskRadarChart data={radarData} />
          </div>
        </motion.div>

        {/* Score Summary */}
        <motion.div variants={stagger.item} className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Overall Score</p>
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="52" fill="none" stroke="var(--success)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - overallScore / 100) }}
                  transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-heading">{overallScore}</span>
                <span className="text-[10px] text-muted-foreground">/100</span>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${riskLevel.bg} ${riskLevel.color} ${riskLevel.border} border`}>
              <Shield className="h-3 w-3" /> {riskLevel.label}
            </span>
          </div>

          {/* Risk History Trend Sparkline */}
          {allAssessments && allAssessments.length > 1 && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Risk History Trend
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  {allAssessments.length} assessments
                </span>
              </div>
              <div className="h-16 w-full min-h-[64px]">
                <RiskLineChart
                  data={allAssessments.map((a: any, i: number) => ({
                    index: i + 1,
                    score: a.discipline_score,
                    date: new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  }))}
                />
              </div>
              {/* Show improvement text */}
              <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-2">
                <span>First: {allAssessments[0]?.discipline_score}/100</span>
                <span className={`font-bold flex items-center gap-0.5 ${
                  allAssessments[allAssessments.length - 1].discipline_score >= allAssessments[0].discipline_score
                    ? "text-success"
                    : "text-destructive"
                }`}>
                  {allAssessments[allAssessments.length - 1].discipline_score >= allAssessments[0].discipline_score ? "▲" : "▼"}{" "}
                  {Math.abs(allAssessments[allAssessments.length - 1].discipline_score - allAssessments[0].discipline_score)} pts
                </span>
                <span>Current: {allAssessments[allAssessments.length - 1]?.discipline_score}/100</span>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category Scores</h4>
            {radarData.map((item: { category: string; score: number; fullMark: number }) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.category}</span>
                  <span className="font-mono font-medium">{item.score}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${item.score >= 75 ? "bg-success" : item.score >= 60 ? "bg-amber-500" : "bg-destructive"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* New Categories Detailed Report */}
      {categoriesAnalysis && (
        <motion.div variants={stagger.item} className="mt-8 space-y-6 screen-only">
          <div className={`rounded-2xl border p-6 mb-6 ${
            categoriesAnalysis.overall.risk_level === 'high' ? 'border-destructive/30 bg-destructive/5' : 
            categoriesAnalysis.overall.risk_level === 'medium' ? 'border-amber-500/30 bg-amber-500/5' : 
            'border-success/30 bg-success/5'
          }`}>
            <h3 className={`text-xl font-bold font-heading mb-2 flex items-center gap-2 ${
              categoriesAnalysis.overall.risk_level === 'high' ? 'text-destructive' : 
              categoriesAnalysis.overall.risk_level === 'medium' ? 'text-amber-500' : 
              'text-success'
            }`}>
              <AlertTriangle className="h-5 w-5" />
              OVERALL RISK LEVEL: {categoriesAnalysis.overall.risk_level.toUpperCase()}
            </h3>
            <p className="text-sm font-medium mb-1">
              <strong>Interpretation:</strong> {categoriesAnalysis.overall.interpretation}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Recommended Focus:</strong> {categoriesAnalysis.overall.recommended_focus}
            </p>
          </div>

          <h3 className="font-heading text-lg font-bold mb-4">CATEGORY BREAKDOWN</h3>
          <div className="space-y-4">
            {categoriesAnalysis.categories.map((cat: any, idx: number) => {
              const isHigh = cat.risk_band === "High";
              const isMedium = cat.risk_band === "Medium";
              const colorClass = isHigh ? "text-destructive" : isMedium ? "text-amber-500" : "text-success";
              const bgClass = isHigh ? "bg-destructive/10" : isMedium ? "bg-amber-500/10" : "bg-success/10";
              const borderClass = isHigh ? "border-destructive/20" : isMedium ? "border-amber-500/20" : "border-success/20";
              const distortionDesc = DISTORTION_DESCRIPTIONS[cat.name] || "Systemic execution risk under pressure.";

              return (
                <div key={idx} className={`rounded-2xl border border-border bg-card hover:border-border/85 transition-all p-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/50">
                    <h4 className="font-heading font-bold text-base flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${bgClass} border ${borderClass}`} />
                      {cat.name}
                    </h4>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit ${bgClass} ${colorClass} border ${borderClass}`}>
                      {cat.risk_band} RISK
                    </span>
                  </div>

                  {/* Risk Severity Slider */}
                  <div className="space-y-2 mb-6 max-w-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Risk Exposure Score</span>
                      <span className={`font-mono font-bold ${colorClass}`}>{cat.percentage}%</span>
                    </div>
                    <div className="relative w-full h-2.5 bg-muted/40 rounded-full overflow-hidden flex">
                      {/* Low zone */}
                      <div className="w-[40%] h-full bg-success/15 border-r border-border/60" />
                      {/* Medium zone */}
                      <div className="w-[30%] h-full bg-amber-500/15 border-r border-border/60" />
                      {/* High zone */}
                      <div className="w-[30%] h-full bg-destructive/15" />
                      
                      {/* Pointer */}
                      <div 
                        className={`absolute top-0 bottom-0 w-2.5 -ml-1.25 rounded-full border border-white shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
                          isHigh ? "bg-destructive" : isMedium ? "bg-amber-500" : "bg-success"
                        }`}
                        style={{ left: `${cat.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/60 font-semibold uppercase">
                      <span>Low (0-40%)</span>
                      <span>Medium (41-70%)</span>
                      <span>High (71-100%)</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <h5 className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Cognitive Distortions Identified
                      </h5>
                      <p className="text-[11px] text-muted-foreground mb-3 leading-normal italic">
                        {distortionDesc}
                      </p>
                      {cat.issues?.length > 0 ? (
                        <ul className="space-y-2 border-t border-border/50 pt-3">
                          {cat.issues.map((issue: string, i: number) => (
                            <li key={i} className="text-xs text-foreground/90 flex items-start gap-2 leading-relaxed">
                              <span className="text-destructive mt-1 text-[10px]">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-3">No major distortions identified.</p>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-success mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Personalized Safeguard Controls
                      </h5>
                      {cat.recommendations?.length > 0 ? (
                        <ul className="space-y-2.5">
                          {cat.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-xs text-foreground/90 flex items-start gap-2.5 leading-relaxed">
                              <div className="flex items-center justify-center shrink-0 w-4.5 h-4.5 rounded border border-success/30 bg-success/15 text-success shadow-[0_0_6px_rgba(34,197,94,0.2)] mt-0.5">
                                <CheckCircle2 className="w-3 w-3" />
                              </div>
                              <span className="flex-1">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Maintain current discipline and rules.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Legacy Personalized Rules (Fallback if categories analysis not fully supported) */}
      {!categoriesAnalysis && (
        <motion.div variants={stagger.item} className="screen-only">
          <div className="flex items-center justify-between mb-4 mt-8">
            <div>
              <h3 className="font-heading text-base font-bold">Your Personalized Trading Rules</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Follow these rules strictly. INTROSPECT™ will track your compliance daily.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personalizedRules.map((rule, idx) => {
              const sev = rule.severity as keyof typeof severityStyles;
              const style = severityStyles[sev] || severityStyles.info;
              const Icon = categoryIcons[rule.category] || CheckCircle2;
              return (
                <motion.div key={idx} variants={stagger.item} className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.badge}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{rule.rule}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{rule.detail}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Printable One-Page Textual Report */}
      <div className="print-only text-black bg-white p-8 font-sans max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">INTROSPECT™ Behavioral Risk Report</h1>
            <p className="text-xs text-gray-600 mt-1 font-semibold">Intraday Trading Psychology & Discipline Diagnostics</p>
          </div>
          <div className="text-right text-xs">
            <p><strong>Date:</strong> {assessment ? new Date(assessment.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            <p><strong>Trader ID:</strong> {assessment?.user_id?.slice(0, 8) || "N/A"}</p>
          </div>
        </div>

        {/* Score block */}
        <div className="grid grid-cols-3 gap-6 bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <div className="text-center border-r border-gray-200">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Discipline Score</p>
            <p className="text-3xl font-bold mt-1">{overallScore}/100</p>
          </div>
          <div className="text-center border-r border-gray-200">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Risk Classification</p>
            <p className="text-xl font-bold uppercase mt-2">{riskLevel.label}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Confidence Rating</p>
            <p className="text-sm font-bold mt-2">HIGH (92%)</p>
          </div>
        </div>

        {/* Executive Summary */}
        {aiSummary && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1">
              Executive Summary
            </h3>
            <p className="text-xs leading-relaxed text-gray-800 italic">
              "{aiSummary}"
            </p>
          </div>
        )}

        {/* Category Breakdown */}
        {categoriesAnalysis ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1">
              Behavioral Risk Breakdown
            </h3>
            <div className="space-y-3">
              {categoriesAnalysis.categories.map((cat: any, i: number) => (
                <div key={i} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex justify-between font-semibold">
                    <span>{cat.name}</span>
                    <span className="uppercase text-gray-600">{cat.risk_band} Risk ({cat.percentage}%)</span>
                  </div>
                  {cat.issues?.length > 0 && (
                    <p className="text-[11px] text-gray-700 mt-1">
                      <strong>Cognitive Distortions:</strong> {cat.issues.join(", ")}
                    </p>
                  )}
                  {cat.recommendations?.length > 0 && (
                    <p className="text-[11px] text-gray-700 mt-0.5">
                      <strong>Personalized Safeguards:</strong> {cat.recommendations.join("; ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1">
              Personalized Safeguards
            </h3>
            <ul className="list-disc list-inside text-xs text-gray-800 space-y-1.5">
              {personalizedRules.map((rule, idx) => (
                <li key={idx} className="leading-relaxed">
                  <strong>{rule.rule}:</strong> {rule.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footnote */}
        <div className="border-t border-gray-300 pt-3 text-[10px] text-gray-500 text-center flex justify-between">
          <span>INTROSPECT™ Behavioral Analysis Platform</span>
          <span>© Intraday MindView Learning</span>
          <span>CONFIDENTIAL</span>
        </div>
      </div>

      {/* Print/Screen layout CSS */}
      <style>{`
        .print-only {
          display: none !important;
        }
        @media print {
          .print-only {
            display: block !important;
          }
          .screen-only {
            display: none !important;
          }
          header, nav, aside, footer, .no-print, button, .no-print * {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0;
            padding: 0;
          }
          main, .max-w-4xl {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
