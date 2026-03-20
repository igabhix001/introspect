"use client";

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
} from "lucide-react";
import Link from "next/link";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAuth } from "@/lib/auth/auth-context";
import { useAssessmentQuery } from "@/lib/hooks/use-queries";

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
  const { loading: authLoading } = useAuth();
  const { data: assessment, isLoading: assessmentLoading } = useAssessmentQuery();

  const loading = assessmentLoading && !assessment;

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

  const overallScore = assessment?.discipline_score || 50;
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
      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <motion.div variants={stagger.item} className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">Risk Profile Analysis</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Based on your diagnostic assessment</p>
            </div>
            <Link href="/dashboard/assessment" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="h-3 w-3" /> Retake
            </Link>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", padding: "8px 12px", color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                  itemStyle={{ color: "var(--success)" }}
                  formatter={(value) => [`${value}/100`, "Score"]}
                />
                <Radar dataKey="score" stroke="var(--success)" strokeWidth={2} fill="var(--success)" fillOpacity={0.15} dot={{ r: 4, fill: "var(--success)", strokeWidth: 0 }} />
              </RadarChart>
            </ResponsiveContainer>
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
        <motion.div variants={stagger.item} className="mt-8 space-y-6">
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

              return (
                <div key={idx} className={`rounded-xl border ${borderClass} bg-card p-5`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/50">
                    <h4 className="font-heading font-bold text-base flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${bgClass} border ${borderClass}`} />
                      {cat.name}
                    </h4>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded w-fit ${bgClass} ${colorClass}`}>
                      {cat.risk_band} RISK
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="h-3.5 w-3.5" /> Issues Found
                      </h5>
                      {cat.issues?.length > 0 ? (
                        <ul className="space-y-2">
                          {cat.issues.map((issue: string, i: number) => (
                            <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No major issues identified.</p>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-success mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mandatory Rules
                      </h5>
                      {cat.recommendations?.length > 0 ? (
                        <ul className="space-y-2">
                          {cat.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-success/10 text-success border border-success/20 flex items-center justify-center shrink-0 mt-0 font-mono text-[10px] font-bold">
                                {i + 1}
                              </div>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Maintain current discipline.</p>
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
        <motion.div variants={stagger.item}>
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
    </motion.div>
  );
}
