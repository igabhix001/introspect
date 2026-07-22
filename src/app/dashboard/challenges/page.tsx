"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  CheckCircle2,
  Target,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
  Share2,
  Medal,
  Zap,
  Activity,
  Download,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useChallengesQuery, queryKeys } from "@/lib/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

interface ChallengeRow {
  id: string;
  type: string;
  name: string;
  start_date: string;
  current_day: number;
  status: string;
  rules_to_follow: string[];
  created_at: string;
  completed_at: string | null;
  last_checkin_date: string | null;
}

const challengeTemplates = [
  {
    type: "30",
    tier: "30-Day Discipline Challenge",
    title: "30-Day Builder",
    duration: "30 DAYS",
    focus: "Basic Rules",
    badge: "Bronze Badge",
    badgeIcon: "🟫",
    difficulty: "★★☆☆☆",
    difficultyLabel: "Beginner",
    activeCount: "234 active",
    color: "amber",
    extraBadge: undefined as string | undefined,
  },
];

const stagger = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } },
};

export default function ChallengesPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: challengesData, isLoading: challengesLoading } = useChallengesQuery();
  
  const challenges = [
    ...(challengesData?.active ? [challengesData.active as ChallengeRow] : []),
    ...((challengesData?.history || []) as ChallengeRow[]),
  ];
  
  const [starting, setStarting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();
  
  const loading = challengesLoading && !challengesData;

  const startChallenge = async (template: typeof challengeTemplates[0]) => {
    if (!user) return;
    setStarting(template.type);

    await supabase.from("challenges").insert({
      user_id: user.id,
      type: template.type,
      name: template.title,
      start_date: new Date().toISOString().split("T")[0],
      current_day: 0,
      status: "active",
      rules_to_follow: ["Follow all trading rules", "Log every trade", "Use stop-loss"],
      daily_progress: [],
    });

    // Invalidate queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.challenges(user.id) });
    setStarting(null);
  };

  const activeChallenge = challenges.find((c) => c.status === "active");
  const completedChallenges = challenges.filter((c) => c.status === "completed");

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true);
    try {
      const res = await fetch(`/api/challenges/export?format=${format}`);
      if (format === "csv") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `challenges_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `challenges_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export error:", error);
    }
    setExporting(false);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Hero Section */}
      <motion.div variants={stagger.item} className="text-center py-6">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight mb-3">
          CHALLENGES - MASTER YOUR DISCIPLINE
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          3 Levels • 3 Rewards • 1 Goal: Consistent Profits
        </p>
        <div className="bg-card border border-border rounded-xl p-4 max-w-3xl mx-auto mb-6 shadow-sm">
          <p className="font-medium text-foreground">
            &ldquo;Complete challenges to unlock badges and build unshakeable trading discipline&rdquo;
          </p>
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
          {activeChallenge && (
            <div className="px-6 py-2.5 rounded-full bg-success text-success-foreground font-semibold text-sm shadow-md flex items-center gap-2">
              <span>Current: {activeChallenge.name} (Day {activeChallenge.current_day}/{activeChallenge.type})</span>
              <span className="text-success-foreground/70 text-xs">
                | Started: {new Date(activeChallenge.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                → Ends: {new Date(new Date(activeChallenge.start_date).getTime() + parseInt(activeChallenge.type) * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
          )}
          <Link href="/dashboard/loyalty" className="px-6 py-2.5 rounded-full border border-border hover:bg-muted font-medium text-sm transition-colors">
            View Loyalty Points
          </Link>
          {activeChallenge && (
            <Link
              href="/dashboard/journal"
              className="px-6 py-2.5 rounded-full bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Log Trade to Check-in
            </Link>
          )}
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting || challenges.length === 0}
            className="px-4 py-2.5 rounded-full border border-border hover:bg-muted font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </button>
        </div>
      </motion.div>

      {/* Auto Check-in Info Banner with Last Journal Date */}
      {activeChallenge && (
        <motion.div variants={stagger.item} className="bg-success/10 border border-success/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm text-success">Automatic Daily Check-in</h3>
                {activeChallenge.last_checkin_date && (
                  <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">
                    Last Journal: {new Date(activeChallenge.last_checkin_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Your challenge progress is <strong>automatically updated</strong> when you log a trade in your journal. 
                One journal entry per day = one day of progress ({activeChallenge.current_day}/{activeChallenge.type}). 
                Skipped days don&apos;t reset your progress - just keep journaling!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5. Benefits Highlight Section */}
      <motion.div variants={stagger.item} className="bg-card border border-border rounded-2xl p-6 overflow-hidden">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4" /> 
          Why Take Challenges?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-success/20 bg-success/[0.03] text-center">
            <Star className="h-6 w-6 text-success mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">BUILD HABITS</h3>
            <p className="text-xs text-muted-foreground">Master consistency</p>
          </div>
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] text-center">
            <Medal className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">COLLECT BADGES</h3>
            <p className="text-xs text-muted-foreground">Exclusive profile recognition</p>
          </div>
          <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.03] text-center">
            <CheckCircle2 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">UNLOCK VALUE</h3>
            <p className="text-xs text-muted-foreground">Refer friends to earn free months</p>
          </div>
        </div>
      </motion.div>

      {/* 2. Challenge Cards - Comparison View */}
      <motion.div variants={stagger.item} className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Target className="h-4 w-4" /> 
          Choose Your Challenge
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challengeTemplates.map((template) => {
            const alreadyActive = challenges.some((c) => c.type === template.type && c.status === "active");
            const isCompleted = challenges.some((c) => c.type === template.type && c.status === "completed");
            
            // Tier progression: must complete previous tier to unlock next
            const has30Completed = challenges.some((c) => c.type === "30" && c.status === "completed");
            const has60Completed = challenges.some((c) => c.type === "60" && c.status === "completed");
            
            const isLocked = 
              (template.type === "60" && !has30Completed) ||
              (template.type === "90" && !has60Completed);

            return (
              <div 
                key={template.type}
                className={`flex flex-col rounded-3xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative ${
                  alreadyActive ? 'ring-2 ring-success/50' : ''
                }`}
              >
                {/* Header */}
                <div className={`p-6 pb-4 border-b border-border text-center ${
                  template.color === 'yellow' ? 'bg-amber-500/[0.05]' : ''
                }`}>
                  <div className="text-2xl mb-2">{template.tier.includes('1') ? '🌱' : template.tier.includes('2') ? '🌿' : '🌳'}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{template.tier}</div>
                  <h3 className="text-xl font-heading font-bold">{template.title}</h3>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-center gap-2 text-foreground font-mono font-medium mb-6 py-2 px-4 rounded-lg bg-muted/50 w-full text-center">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {template.duration}
                  </div>

                  <div className="mb-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Focus:</div>
                    <div className="font-medium">{template.focus}</div>
                  </div>

                  <hr className="border-border mb-6" />

                  <div className="mb-6 flex-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5" /> Rewards:
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-sm">
                        <span className="text-base leading-none">{template.badgeIcon}</span>
                        <span>{template.badge}</span>
                      </li>
                      {template.extraBadge && (
                        <li className="flex items-center gap-2 text-sm">
                          <span className="text-base leading-none">💎</span>
                          <span>Platinum Path</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="mb-6 pb-4 border-b border-border/50">
                    <div className="text-xs text-muted-foreground flex justify-between items-center">
                      <span>Difficulty:</span>
                      <span className="font-mono text-amber-500 tracking-widest">{template.difficulty}</span>
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground mt-1">{template.difficultyLabel}</div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <button
                      onClick={() => startChallenge(template)}
                      disabled={alreadyActive || isCompleted || isLocked || (activeChallenge !== undefined && !alreadyActive) || starting === template.type}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        alreadyActive ? 'bg-success text-success-foreground' :
                        isCompleted ? 'bg-muted text-muted-foreground border border-border' :
                        isLocked ? 'bg-muted/50 text-muted-foreground opacity-60 cursor-not-allowed border border-dashed border-border' :
                        activeChallenge ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed' :
                        'bg-foreground text-background hover:bg-foreground/90'
                      }`}
                    >
                      {starting === template.type ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : alreadyActive ? (
                        <>Active Now</>
                      ) : isCompleted ? (
                        <>Completed <CheckCircle2 className="h-4 w-4" /></>
                      ) : isLocked ? (
                        <>🔒 Complete {template.type === "60" ? "30-Day" : "60-Day"} First</>
                      ) : (
                        "START CHALLENGE"
                      )}
                    </button>
                    <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                      <Activity className="h-3 w-3" />
                      {template.activeCount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>



      {/* 8. Completed Challenges Showcase */}
      {completedChallenges.length > 0 && (
        <motion.div variants={stagger.item} className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Medal className="h-4 w-4" /> 
            Your Challenge Legacy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedChallenges.map((challenge) => {
              const badgeMap: Record<string, string> = { "30": "Bronze", "60": "Silver", "90": "Gold" };
              const badge = badgeMap[challenge.type] || "Bronze";
              return (
                <div key={challenge.id} className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="h-24 w-24" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-success font-bold text-sm mb-1 uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" />
                      Completed
                    </div>
                    <h3 className="font-heading text-lg font-bold mb-3">{challenge.name}</h3>
                    <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                      <p>✨ Rewards Issued: <span className="font-bold text-foreground">{badge} Badge</span></p>
                      <p>📅 Finished: {new Date(challenge.completed_at || challenge.start_date).toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="text-xs font-semibold px-3 py-1.5 bg-muted hover:bg-border rounded-lg transition-colors flex items-center gap-1.5">
                        <Share2 className="h-3 w-3" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
