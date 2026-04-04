"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/use-queries";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
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

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

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
        const supabase = createClient();
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
        }
      } catch (err) {
        console.error("Assessment submission error:", err);
      }
      setSubmitting(false);
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const isAnswered = answers[currentQuestion?.id] !== undefined;

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 border border-success/20 flex items-center justify-center"
        >
          <CheckCircle2 className="h-10 w-10 text-success" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold mb-3">
          Assessment Complete!
        </h2>
        {result && (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-2xl font-bold text-success">{result.discipline_score}</p>
                <p className="text-[10px] text-muted-foreground">Discipline Score</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-lg font-bold text-amber-500 capitalize">{result.risk_level}</p>
                <p className="text-[10px] text-muted-foreground">Risk Level</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-lg font-bold text-blue-500 capitalize">{result.trader_level}</p>
                <p className="text-[10px] text-muted-foreground">Trader Level</p>
              </div>
            </div>
            <div className="text-left rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold mb-2">Your Personalized Rules:</p>
              <ul className="space-y-1">
                {result.personalized_rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <button
          onClick={async () => {
            setNavigating(true);
            // Ensure cache is fresh before navigating
            if (user?.id) {
              await queryClient.invalidateQueries({ queryKey: queryKeys.assessment(user.id) });
              await queryClient.refetchQueries({ queryKey: queryKeys.assessment(user.id) });
            }
            router.push("/dashboard/risk-report");
          }}
          disabled={navigating}
          className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all cursor-pointer disabled:opacity-70"
        >
          {navigating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Loading Report...</>
          ) : (
            <>View Your Risk Report<ArrowRight className="h-4 w-4" /></>
          )}
        </button>
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
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-center gap-4">
                <input
                  type="number"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  step={currentQuestion.step}
                  value={
                    (answers[currentQuestion.id] as number) ?? ""
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (e.target.value === "") return;
                    if (val >= (currentQuestion.min || 1) && val <= (currentQuestion.max || 5)) {
                      handleAnswer(val);
                    }
                  }}
                  placeholder={`${currentQuestion.min}–${currentQuestion.max}`}
                  className="w-24 text-3xl font-bold font-heading text-center px-3 py-3 rounded-xl border border-border bg-background/50 focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-muted-foreground">
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
