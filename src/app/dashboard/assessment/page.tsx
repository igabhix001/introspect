"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  Shield,
  Target,
  Brain,
  Clock,
  Flame,
  Loader2,
  Lock,
  Star,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, useAssessmentQuery } from "@/lib/hooks/use-queries";

interface Question {
  id: string;
  category: string;
  categoryIcon: React.ElementType;
  question: string;
  description?: string;
  type: "single" | "scale" | "number";
  options?: { label: string; value: string; description?: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

// Client's exact 12 questions with weights and categories
const questions: Question[] = [
  {
    id: "q1",
    category: "Stop-Loss & Loss Response",
    categoryIcon: Shield,
    question: "When price approaches my stop-loss, I feel discomfort affecting exit.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q2",
    category: "Stop-Loss & Loss Response",
    categoryIcon: Shield,
    question: "After a losing trade, I feel pressure to recover quickly.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q3",
    category: "Stop-Loss & Loss Response",
    categoryIcon: Shield,
    question: "I delay exits even when the plan is clear.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q4",
    category: "Behaviour After Profits",
    categoryIcon: Target,
    question: "After consecutive wins, confidence increases significantly.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q5",
    category: "Behaviour After Profits",
    categoryIcon: Target,
    question: "I increase position size after profits.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q6",
    category: "Behaviour After Profits",
    categoryIcon: Target,
    question: "Rules feel flexible when things go well.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q7",
    category: "Risk Planning & Positioning",
    categoryIcon: Brain,
    question: "Exact ₹ risk is not always predefined.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q8",
    category: "Risk Planning & Positioning",
    categoryIcon: Brain,
    question: "I sometimes enter trades without calculating exact risk.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q9",
    category: "Impulse & Over-Participation",
    categoryIcon: Flame,
    question: "I trade to participate rather than wait for clear setup.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q10",
    category: "Impulse & Over-Participation",
    categoryIcon: Flame,
    question: "Staying inactive in slow markets feels difficult.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q11",
    category: "Rule Consistency",
    categoryIcon: Clock,
    question: "Under pressure, I override predefined rules.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
  {
    id: "q12",
    category: "Rule Consistency",
    categoryIcon: Clock,
    question: "Similar mistakes repeat despite review.",
    description: "Rate how much you agree with this statement (1 = Strongly Disagree, 5 = Strongly Agree)",
    type: "scale",
    min: 1,
    max: 5,
    step: 1,
  },
];

export default function AssessmentPage() {
  const { user, hasActiveSubscription, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: existingAssessment, isLoading: assessmentLoading } = useAssessmentQuery();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [result, setResult] = useState<{
    discipline_score: number;
    risk_level: string;
    trader_level: string;
    personalized_rules: string[];
  } | null>(null);

  const [aiProfile, setAiProfile] = useState<{
    archetype: string;
    triggers: string[];
    tailRiskScenario: string;
    defensePlan: string[];
  } | null>(null);
  const [loadingAiProfile, setLoadingAiProfile] = useState(false);
  const [aiProfileError, setAiProfileError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string>("free"); // free, paywall, limit_exceeded, allowed

  const fetchAiProfile = useCallback(async () => {
    setLoadingAiProfile(true);
    setAiProfileError(null);
    try {
      const response = await fetch("/api/assessment/ai-profile");
      const data = await response.json();
      if (data.profile) {
        setAiProfile(data.profile);
        setAiStatus("allowed");
      } else if (data.aiStatus) {
        setAiStatus(data.aiStatus);
        if (data.message) {
          setAiProfileError(data.message);
        }
      } else {
        setAiProfileError(data.message || "Failed to load AI profile.");
      }
    } catch (err) {
      console.error("Error fetching AI profile:", err);
      setAiProfileError("An error occurred loading the AI profile.");
    }
    setLoadingAiProfile(false);
  }, []);

  useEffect(() => {
    if (completed) {
      fetchAiProfile();
    }
  }, [completed, fetchAiProfile]);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  // Check if non-subscriber has already used their free assessment
  // Active subscribers can always retake assessments - no restriction for them
  // Only check when auth is loaded and subscription status is explicitly false
  const hasUsedFreeAssessment = !authLoading && hasActiveSubscription === false && !!existingAssessment;

  // Show loading state while checking assessment status (only for non-subscribers when auth is loaded)
  if (!authLoading && hasActiveSubscription === false && assessmentLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If non-subscriber has already taken their free assessment, show subscribe prompt
  // Active subscribers skip this check entirely
  if (hasUsedFreeAssessment) {
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
          Free Assessment Used
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          You&apos;ve already taken your one free assessment. Subscribe to take unlimited assessments and unlock your full risk report.
        </p>
        
        {/* Show previous score */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6 max-w-xs mx-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Previous Score</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-3xl font-bold text-success">{existingAssessment.discipline_score}</p>
              <p className="text-[10px] text-muted-foreground">Discipline Score</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-lg font-bold text-amber-500 capitalize">{existingAssessment.risk_level}</p>
              <p className="text-[10px] text-muted-foreground">Risk Level</p>
            </div>
          </div>
        </div>

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
        <p className="text-[11px] text-muted-foreground mt-4">Unlimited assessments · Full report access · Cancel anytime</p>
      </motion.div>
    );
  }

  const handleAnswer = useCallback(
    (value: string | number) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion]
  );

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Submit to API
      setSubmitting(true);
      try {
        const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
          question_id: questionId,
          answer,
        }));

        const response = await fetch("/api/assessment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answers: answersArray }),
        });

        if (response.ok) {
          const data = await response.json();
          // The API returns { assessment, categories_analysis, disciplineScore, riskLevel }
          // We map this back to the state shape expected by the frontend
          setResult({
            discipline_score: data.disciplineScore,
            risk_level: data.riskLevel,
            trader_level: data.assessment?.trader_level || 'beginner',
            personalized_rules: data.categories_analysis?.categories?.flatMap((c: any) => c.recommendations).slice(0, 5) || [],
          });
          
          // Invalidate assessment cache and wait for refetch before navigating
          if (user?.id) {
            await queryClient.invalidateQueries({ queryKey: queryKeys.assessment(user.id) });
            await queryClient.refetchQueries({ queryKey: queryKeys.assessment(user.id) });
          }
          setCompleted(true);
        } else if (response.status === 403) {
          // Free assessment limit reached - redirect to payments
          const data = await response.json();
          if (data.requiresSubscription) {
            router.push("/dashboard/payments?reason=assessment-limit");
          }
        }
      } catch (err) {
        console.error("Assessment submission error:", err);
      }
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const isAnswered = answers[currentQuestion?.id] !== undefined;

  if (completed) {
    const riskColor =
      result?.risk_level === "low"
        ? "text-success"
        : result?.risk_level === "high"
        ? "text-destructive"
        : "text-amber-500";

    const riskBorder =
      result?.risk_level === "low"
        ? "border-success/30 bg-success/5"
        : result?.risk_level === "high"
        ? "border-destructive/30 bg-destructive/5"
        : "border-amber-500/30 bg-amber-500/5";

    // Active subscribers see full results and can view report
    const isActive = hasActiveSubscription === true;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto py-12"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-5 rounded-full bg-success/10 border border-success/20 flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-success" />
          </motion.div>
          <h2 className="font-heading text-2xl font-bold mb-2">Assessment Complete!</h2>
          <p className="text-sm text-muted-foreground">
            {isActive ? "Your full results are ready" : "Here's a preview of your results"}
          </p>
        </div>

        {result && (
          <div className="space-y-4 mb-6">
            {/* VISIBLE: Discipline Score */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-success/30 bg-success/5 p-5 flex items-center gap-5"
            >
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="var(--muted)" strokeWidth="5" />
                  <motion.circle
                    cx="32" cy="32" r="26" fill="none" stroke="var(--success)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - result.discipline_score / 100) }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-success">{result.discipline_score}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Discipline Score</p>
                <p className="text-3xl font-heading font-bold text-success">{result.discipline_score}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
              </div>
            </motion.div>

            {/* VISIBLE: Risk Level */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-xl border p-5 flex items-center gap-4 ${riskBorder}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${riskBorder}`}>
                <Shield className={`h-5 w-5 ${riskColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Risk Level</p>
                <p className={`text-xl font-heading font-bold capitalize ${riskColor}`}>{result.risk_level} Risk</p>
              </div>
            </motion.div>

            {/* Trader Level - VISIBLE for active, LOCKED for non-active */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`relative rounded-xl border ${isActive ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-card"} p-5 overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Trader Level</p>
                {!isActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
              </div>
              {isActive ? (
                <p className="text-xl font-heading font-bold capitalize text-blue-500">{result.trader_level}</p>
              ) : (
                <div style={{ filter: "blur(6px)", userSelect: "none" }} aria-hidden="true" className="pointer-events-none">
                  <p className="text-xl font-heading font-bold capitalize text-blue-500">{result.trader_level}</p>
                </div>
              )}
            </motion.div>

            {/* Personalized Rules - VISIBLE for active, LOCKED for non-active */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-border/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Personalized Rules</p>
                {!isActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
              </div>
              {isActive ? (
                <div className="p-4 space-y-2">
                  {(result.personalized_rules.length > 0 ? result.personalized_rules : [
                    "Maximum 1% risk per trade at all times",
                    "Mandatory stop-loss before every entry",
                    "10-minute cooldown after any losing trade",
                    "Maximum 5 high-conviction trades per day",
                    "Journal emotional state for every trade",
                  ]).map((rule, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                      <span className="text-xs text-foreground">{rule}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="p-4 space-y-2" style={{ filter: "blur(5px)", userSelect: "none" }} aria-hidden="true">
                    {(result.personalized_rules.length > 0 ? result.personalized_rules : [
                      "Maximum 1% risk per trade at all times",
                      "Mandatory stop-loss before every entry",
                      "10-minute cooldown after any losing trade",
                      "Maximum 5 high-conviction trades per day",
                      "Journal emotional state for every trade",
                    ]).map((rule, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground">{rule}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 top-[44px] flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-muted/80 border border-border flex items-center justify-center mb-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-semibold text-foreground mb-0.5">Subscribe to unlock your rules</p>
                    <p className="text-[11px] text-muted-foreground">100+ personalized rules generated for you</p>
                  </div>
                </>
              )}
            </motion.div>

            {/* AI Psychological Profiler Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="relative rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.01] p-5 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-1.5">
                    INTROSPECT™ AI Psychological Profiler
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    INTROSPECT™ AI Cognitive Synthesis
                  </p>
                </div>
              </div>

              {loadingAiProfile ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">Synthesizing behavioral metrics...</span>
                </div>
              ) : aiStatus === "paywall" ? (
                <div className="relative p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-muted/80 border border-border flex items-center justify-center mx-auto mb-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Unlock AI Psychological Profiling</p>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-xs mx-auto">
                      Get a customized analysis of your trading personality archetype, tilt triggers, and a personalized defense plan.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/payments"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Upgrade Plan to Unlock
                  </Link>
                </div>
              ) : aiStatus === "limit_exceeded" ? (
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-center space-y-2">
                  <AlertTriangle className="h-5 w-5 text-destructive mx-auto" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">Daily AI Review Limit Reached</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      You have reached your daily limit of 5 AI reviews. Your limit resets tomorrow.
                    </p>
                  </div>
                </div>
              ) : aiProfile ? (
                <div className="space-y-4 text-xs text-left">
                  {/* Archetype */}
                  <div className="p-3.5 rounded-xl border border-border bg-card">
                    <p className="text-[9px] text-primary uppercase font-bold tracking-wider mb-1">Archetype Personality</p>
                    <p className="font-heading text-sm font-bold text-foreground mb-1">{aiProfile.archetype.split(" - ")[0]}</p>
                    <p className="text-muted-foreground leading-relaxed">{aiProfile.archetype.split(" - ")[1] || aiProfile.archetype}</p>
                  </div>

                  {/* Triggers */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-amber-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Tilt Triggers
                    </p>
                    {aiProfile.triggers.map((t, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg border border-border/40 bg-card/40">
                        <span className="text-amber-500 font-semibold">•</span>
                        <span className="text-muted-foreground leading-relaxed">{t}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tail Risk Scenario */}
                  <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1">
                    <p className="text-[9px] text-destructive uppercase font-bold tracking-wider flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Tail-Risk Scenario
                    </p>
                    <p className="text-muted-foreground leading-relaxed font-medium">{aiProfile.tailRiskScenario}</p>
                  </div>

                  {/* Defense Plan */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-success uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Customized Defense Plan
                    </p>
                    {aiProfile.defensePlan.map((d, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg border border-success/15 bg-success/[0.02]">
                        <span className="text-success font-semibold">✓</span>
                        <span className="text-muted-foreground leading-relaxed">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {aiProfileError || "Unable to load AI profile."}
                  <button onClick={fetchAiProfile} className="block mx-auto mt-2 text-primary font-semibold hover:underline">
                    Retry
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* CTA Section - Different for active vs non-active */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-success/10 to-blue-500/10" />
          <div className="relative px-6 py-7 text-center">
            {isActive ? (
              <>
                <h3 className="font-heading text-lg font-bold mb-2">Your Full Report is Ready!</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                  View your complete category breakdown, radar profile, and all personalized trading rules.
                </p>
                <button
                  onClick={async () => {
                    setNavigating(true);
                    if (user?.id) {
                      await queryClient.invalidateQueries({ queryKey: queryKeys.assessment(user.id) });
                      await queryClient.refetchQueries({ queryKey: queryKeys.assessment(user.id) });
                    }
                    router.push("/dashboard/risk-report");
                  }}
                  disabled={navigating}
                  className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold px-7 py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] transition-all cursor-pointer disabled:opacity-70 text-sm"
                >
                  {navigating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Loading Report...</>
                  ) : (
                    <>View Your Risk Report <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">Unlock Your Full Risk Report</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                  Get your complete category breakdown, all personalized rules, and your radar profile — built just for you.
                </p>
                <button
                  onClick={async () => {
                    setNavigating(true);
                    if (user?.id) {
                      await queryClient.invalidateQueries({ queryKey: queryKeys.assessment(user.id) });
                      await queryClient.refetchQueries({ queryKey: queryKeys.assessment(user.id) });
                    }
                    router.push("/dashboard/payments");
                  }}
                  disabled={navigating}
                  className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold px-7 py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] transition-all cursor-pointer disabled:opacity-70 text-sm"
                >
                  {navigating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Please wait...</>
                  ) : (
                    <><Star className="h-4 w-4" /> Subscribe to Unlock Full Report</>
                  )}
                </button>
                <p className="text-[11px] text-muted-foreground mt-4">Cancel anytime · Instant access · No hidden fees</p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const CategoryIcon = currentQuestion.categoryIcon;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-success" />
            <span className="text-xs font-semibold text-success uppercase tracking-wider">
              {currentQuestion.category}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-success rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-2">
            {currentQuestion.question}
          </h2>
          {currentQuestion.description && (
            <p className="text-sm text-muted-foreground mb-6">
              {currentQuestion.description}
            </p>
          )}

          {/* Answer UI based on type */}
          {currentQuestion.type === "single" && currentQuestion.options && (
            <div className="space-y-2.5 mt-6">
              {currentQuestion.options.map((opt) => {
                const isSelected =
                  answers[currentQuestion.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-success bg-success/[0.06] ring-1 ring-success/20"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "border-success bg-success"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-white"
                        />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isSelected ? "text-success" : "text-foreground"
                        }`}
                      >
                        {opt.label}
                      </p>
                      {opt.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === "number" && (
            <div className="mt-6">
              <div className="relative">
                {currentQuestion.unit && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    {currentQuestion.unit}
                  </span>
                )}
                <input
                  type="number"
                  value={
                    (answers[currentQuestion.id] as number) ?? ""
                  }
                  onChange={(e) =>
                    handleAnswer(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  placeholder={currentQuestion.placeholder}
                  className="w-full text-2xl font-bold font-heading px-4 py-4 pl-8 rounded-xl border border-border bg-background/50 focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all placeholder:text-muted-foreground/30 placeholder:font-normal placeholder:text-base"
                />
              </div>
            </div>
          )}

          {currentQuestion.type === "scale" && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isSelected = answers[currentQuestion.id] === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        handleAnswer(num);
                        if (currentStep < questions.length - 1) {
                          setTimeout(() => {
                            setCurrentStep((s) => s + 1);
                          }, 200);
                        }
                      }}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center font-heading text-lg sm:text-xl font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "border-success bg-success text-success-foreground scale-110 shadow-lg shadow-success/25"
                          : "border-border hover:border-success/50 hover:bg-success/5 text-foreground hover:scale-105"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-[9px] sm:text-[10px] text-muted-foreground">
                <span className="rounded-lg bg-success/10 py-1.5 font-medium">1<br/>Strong Discipline</span>
                <span className="rounded-lg bg-success/5 py-1.5">2<br/>Mostly Disciplined</span>
                <span className="rounded-lg bg-amber-500/10 py-1.5">3<br/>Situational Bias</span>
                <span className="rounded-lg bg-orange-500/10 py-1.5">4<br/>Frequent Interference</span>
                <span className="rounded-lg bg-destructive/10 py-1.5 font-medium">5<br/>Emotional Dominance</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!isAnswered || submitting}
          className="flex items-center gap-1.5 bg-success hover:bg-success/90 text-success-foreground font-semibold text-sm px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentStep === questions.length - 1 ? (
            "Complete"
          ) : (
            "Next"
          )}
          {!submitting && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// Scoring is handled entirely by the /api/assessment endpoint using IMV_Master weighted formulas.
