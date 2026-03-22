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
  Award,
  Zap,
  Activity,
  Download,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useChallengesQuery, useLoyaltyQuery, queryKeys } from "@/lib/hooks/use-queries";
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
}

const challengeTemplates = [
  {
    type: "30",
    tier: "Tier 1: Discipline",
    title: "30-Day Builder",
    duration: "30 DAYS",
    focus: "Basic Rules",
    points: 50,
    badge: "Bronze Badge",
    badgeIcon: "🟫",
    difficulty: "★★☆☆☆",
    difficultyLabel: "Beginner",
    activeCount: "234 active",
    color: "amber",
  },
  {
    type: "60",
    tier: "Tier 2: Consistency",
    title: "60-Day Master",
    duration: "60 DAYS",
    focus: "Pattern Building",
    points: 100,
    badge: "Silver Badge",
    badgeIcon: "⚪",
    difficulty: "★★★☆☆",
    difficultyLabel: "Medium",
    activeCount: "156 active",
    color: "zinc",
  },
  {
    type: "90",
    tier: "Tier 3: Elite",
    title: "90-Day Elite",
    duration: "90 DAYS",
    focus: "Mastery",
    points: 150,
    badge: "Gold Badge",
    badgeIcon: "🟡",
    extraBadge: "💎 Platinum Path",
    difficulty: "★★★★★",
    difficultyLabel: "Hard",
    activeCount: "89 active",
    color: "yellow",
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
  const { data: loyaltyData } = useLoyaltyQuery();
  
  const challenges = [
    ...(challengesData?.active ? [challengesData.active as ChallengeRow] : []),
    ...((challengesData?.history || []) as ChallengeRow[]),
  ];
  const totalPoints = (loyaltyData as { points?: number })?.points || 0;
  
  const [starting, setStarting] = useState<string | null>(null);
  const [benefitsOpen, setBenefitsOpen] = useState(false);
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

  const getTierProgress = (pts: number) => {
    if (pts < 300) return { tier: "Bronze", next: 300, pct: (pts / 300) * 100 };
    if (pts < 600) return { tier: "Silver", next: 600, pct: ((pts - 300) / 300) * 100 };
    if (pts < 900) return { tier: "Gold", next: 900, pct: ((pts - 600) / 300) * 100 };
    return { tier: "Platinum", next: 900, pct: 100 };
  };

  const progress = getTierProgress(totalPoints);

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
            &ldquo;Complete challenges to earn points, unlock badges, and build unshakeable trading discipline&rdquo;
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

      {/* Auto Check-in Info Banner */}
      {activeChallenge && (
        <motion.div variants={stagger.item} className="bg-success/10 border border-success/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm text-success mb-1">Automatic Daily Check-in</h3>
              <p className="text-xs text-muted-foreground">
                Your challenge progress is <strong>automatically updated</strong> when you log a trade in your journal. 
                One journal entry per day = one day of challenge progress. Just keep trading and logging!
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-success/20 bg-success/[0.03] text-center">
            <Star className="h-6 w-6 text-success mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">EARN POINTS</h3>
            <p className="text-xs text-muted-foreground">Up to 150 points per challenge</p>
          </div>
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] text-center">
            <Medal className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">COLLECT BADGES</h3>
            <p className="text-xs text-muted-foreground">Exclusive profile recognition</p>
          </div>
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.03] text-center">
            <Award className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">RISE TIERS</h3>
            <p className="text-xs text-muted-foreground">Reach Platinum status</p>
          </div>
          <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.03] text-center">
            <CheckCircle2 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">UNLOCK VALUE</h3>
            <p className="text-xs text-muted-foreground">150 points = 1 Free Month</p>
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
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold">{template.points} POINTS</span>
                      </li>
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

      {/* 3. Detailed Benefits Breakdown */}
      <motion.div variants={stagger.item} className="bg-card border border-border rounded-xl font-medium overflow-hidden">
        <button 
          onClick={() => setBenefitsOpen(!benefitsOpen)} 
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-4 w-4" /> Compare All Benefits
          </div>
          {benefitsOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </button>
        
        <AnimatePresence>
          {benefitsOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-6 overflow-hidden border-t border-border"
            >
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Benefit</th>
                      <th className="px-4 py-3">30-Day</th>
                      <th className="px-4 py-3">60-Day</th>
                      <th className="px-4 py-3 rounded-tr-lg">90-Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold">Points</td>
                      <td className="px-4 py-3 font-mono font-medium text-amber-500">50</td>
                      <td className="px-4 py-3 font-mono font-medium text-amber-500">100</td>
                      <td className="px-4 py-3 font-mono font-medium text-amber-500">150</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold">Badge Level</td>
                      <td className="px-4 py-3 text-muted-foreground">🟫 Bronze</td>
                      <td className="px-4 py-3 text-muted-foreground">⚪ Silver</td>
                      <td className="px-4 py-3 text-amber-500 font-medium">🟡 Gold/Platinum</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold">Profile Display</td>
                      <td className="px-4 py-3">✅</td>
                      <td className="px-4 py-3">✅</td>
                      <td className="px-4 py-3">✅</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold">Tier Progress</td>
                      <td className="px-4 py-3">17% to Silver</td>
                      <td className="px-4 py-3">33% to Silver</td>
                      <td className="px-4 py-3 font-medium text-success">50% to Silver</td>
                    </tr>
                    <tr className="border-border">
                      <td className="px-4 py-3 font-semibold">Exclusive Access</td>
                      <td className="px-4 py-3">❌</td>
                      <td className="px-4 py-3">❌</td>
                      <td className="px-4 py-3">✅ Webinar</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              const ptsMap: Record<string, number> = { "30": 50, "60": 100, "90": 150 };
              const badgeMap: Record<string, string> = { "30": "Bronze", "60": "Silver", "90": "Gold" };
              const pts = ptsMap[challenge.type] || 50;
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
                      <p>✨ Rewards Issued: <span className="font-bold text-foreground">{pts} pts</span> • {badge} Badge</p>
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
