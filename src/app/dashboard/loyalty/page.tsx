"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Award,
  History,
  Star,
  Zap,
  TrendingUp,
  Shield,
  Loader2,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  },
  item: { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } },
};

const tiers = [
  { name: "Bronze", min: 0, max: 299, color: "text-amber-700", bg: "bg-amber-700/10", border: "border-amber-700/20" },
  { name: "Silver", min: 300, max: 599, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
  { name: "Gold", min: 600, max: 899, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { name: "Platinum", min: 900, max: 9999, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
];

export default function LoyaltyPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [tier, setTier] = useState("Bronze");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  useEffect(() => {
    async function fetchLoyaltyData() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        
        // Fetch Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_points_balance, total_lifetime_points, current_tier")
          .eq("id", user.id)
          .single();

        if (profile) {
          setPoints(profile.current_points_balance || 0);
          setLifetimePoints(profile.total_lifetime_points || 0);
          setTier(profile.current_tier || "Bronze");
        }

        // Fetch Ledger
        const { data: ledger } = await supabase
          .from("loyalty_points")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (ledger) {
          setTransactions(ledger);
        }
      } catch (err) {
        console.error("Failed to load loyalty data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLoyaltyData();
  }, [user?.id, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    );
  }

  const currentTierInfo = tiers.find(t => t.name.toLowerCase() === tier.toLowerCase()) || tiers[0];
  const nextTierInfo = tiers.find(t => t.min > lifetimePoints) || null;
  const progressToNextTier = nextTierInfo 
    ? Math.min(100, Math.max(0, ((lifetimePoints - currentTierInfo.min) / (nextTierInfo.min - currentTierInfo.min)) * 100))
    : 100;

  // Progress towards a free month (150 points)
  const freeMonthTarget = 150;
  const freeMonthProgress = Math.min(100, (points / freeMonthTarget) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger.container}
        className="space-y-8"
      >
        <motion.div variants={stagger.item}>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Gift className="h-8 w-8 text-success" />
            Loyalty <span className="gradient-text">Rewards</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Earn points for discipline. Redeem for free subscription months.
          </p>
        </motion.div>

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Balance */}
          <motion.div variants={stagger.item} className="p-6 rounded-2xl glass-card border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-success/10 rounded-xl">
                <Zap className="h-5 w-5 text-success" />
              </div>
              <Badge variant="outline" className="border-success/30 text-success bg-success/5 font-semibold">
                Available to Redeem
              </Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
            <h2 className="text-4xl font-heading font-extrabold">{points} <span className="text-sm font-normal text-muted-foreground">pts</span></h2>
          </motion.div>

          {/* Lifetime Points */}
          <motion.div variants={stagger.item} className="p-6 rounded-2xl glass-card border border-border/50 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <History className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Lifetime Earned</p>
            <h2 className="text-4xl font-heading font-extrabold">{lifetimePoints} <span className="text-sm font-normal text-muted-foreground">pts</span></h2>
          </motion.div>

          {/* Current Tier */}
          <motion.div variants={stagger.item} className={`p-6 rounded-2xl glass-card border ${currentTierInfo.border} relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${currentTierInfo.bg} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 ${currentTierInfo.bg} rounded-xl`}>
                <Shield className={`h-5 w-5 ${currentTierInfo.color}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Tier</p>
            <h2 className={`text-4xl font-heading font-extrabold ${currentTierInfo.color}`}>{tier}</h2>
          </motion.div>
        </div>

        {/* Progress & Redemption Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Free Month Progress */}
          <motion.div variants={stagger.item} className="p-6 rounded-2xl bg-card border border-success/20 shadow-lg shadow-success/5">
            <h3 className="text-lg font-heading font-semibold flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-success" />
              Free Month Progress
            </h3>
            <p className="text-xs text-muted-foreground mb-4 italic">
              "Disciplined traders often earn 1–2 free months per year."
            </p>
            
            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium">{points} pts</span>
                <span className="text-sm text-muted-foreground">{freeMonthTarget} pts Goal</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all duration-1000 ease-out rounded-full" 
                  style={{ width: `${freeMonthProgress}%` }}
                />
              </div>
            </div>

            {points >= freeMonthTarget ? (
              <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-start gap-3 mt-6">
                <Gift className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  {redeemSuccess ? (
                    <>
                      <h4 className="font-medium text-success flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Redemption Successful!
                      </h4>
                      <p className="text-sm text-success/80 mt-1">Your subscription has been extended by 1 month.</p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-medium text-success">Reward Unlocked!</h4>
                      <p className="text-sm text-success/80 mt-1">You can now redeem {freeMonthTarget} points for a free subscription month.</p>
                      <button 
                        onClick={async () => {
                          setRedeeming(true);
                          try {
                            const res = await fetch("/api/loyalty/redeem", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ months: 1 }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              setPoints(data.new_balance);
                              setRedeemSuccess(true);
                              setTimeout(() => setRedeemSuccess(false), 5000);
                            } else {
                              alert(data.error || "Redemption failed");
                            }
                          } catch (err) {
                            console.error("Redemption error:", err);
                          }
                          setRedeeming(false);
                        }}
                        disabled={redeeming}
                        className="mt-3 text-sm font-medium bg-success text-success-foreground px-4 py-2 rounded-lg shadow-sm hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Redeem Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground align-middle mt-4">
                <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500" />
                {freeMonthTarget - points} more points needed to unlock a free month.
              </p>
            )}
          </motion.div>

          {/* Tier Progress */}
          <motion.div variants={stagger.item} className="p-6 rounded-2xl glass-card border border-border/50">
            <h3 className="text-lg font-heading font-semibold flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tier Progression
            </h3>
            
            {nextTierInfo ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className={`text-sm font-medium ${currentTierInfo.color}`}>{tier}</span>
                    <span className={`text-sm ${nextTierInfo.color}`}>{nextTierInfo.name} ({nextTierInfo.min} pts)</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-primary transition-all duration-1000 ease-out rounded-full`} 
                      style={{ width: `${progressToNextTier}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Earn {nextTierInfo.min - lifetimePoints} more points to reach {nextTierInfo.name} Status.
                  Tiers are based on lifetime points and never expire.
                </p>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-6">
                <Star className="h-10 w-10 text-cyan-400 mb-2 fill-cyan-400/20" />
                <h4 className="font-semibold text-cyan-400">Maximum Tier Reached</h4>
                <p className="text-sm text-muted-foreground mt-1 text-center">You are a Platinum member.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Referral Link Sharing */}
        <motion.div variants={stagger.item} className="p-6 rounded-2xl bg-card border border-primary/20 shadow-lg">
          <h3 className="text-lg font-heading font-semibold flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            Share & Earn 25 Points
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Invite friends to join using your link. When they subscribe, you earn 25 points!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?ref=${user?.id?.slice(0, 8) || 'loading'}`}
                className="w-full px-4 py-3 pr-24 rounded-xl border border-border bg-muted/30 text-sm font-mono truncate"
              />
              <button
                onClick={() => {
                  const link = `${window.location.origin}/join?ref=${user?.id?.slice(0, 8) || ''}`;
                  navigator.clipboard.writeText(link);
                  alert('Referral link copied!');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Copy Link
              </button>
            </div>
            <button
              onClick={() => {
                const link = `${window.location.origin}/join?ref=${user?.id?.slice(0, 8) || ''}`;
                const text = `Join INTROSPECT™ - the trading discipline platform that helped me become a better trader! Use my link: ${link}`;
                if (navigator.share) {
                  navigator.share({ title: 'Join INTROSPECT™', text, url: link });
                } else {
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }
              }}
              className="px-4 py-3 bg-success text-success-foreground font-medium rounded-xl hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Share Now
            </button>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div variants={stagger.item} className="pt-6">
          <h3 className="text-lg font-heading font-semibold mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </h3>
          
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden glass-card">
            {transactions.length > 0 ? (
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 sm:p-5 hover:bg-muted/10 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm sm:text-base">{tx.description || tx.action || "System Award"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(tx.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${tx.points >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {tx.points >= 0 ? '+' : ''}{tx.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <Gift className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No points activity yet.</p>
                <Link href="/dashboard/challenges" className="mt-4 text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                  Start a challenge to earn points <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
