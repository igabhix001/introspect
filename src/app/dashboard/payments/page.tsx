"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  ArrowRight,
  Shield,
  Crown,
  Star,
  Gift,
  Info,
  Loader2,
  CheckCircle2,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    priceINR: 333,
    priceUSD: 6,
    period: "/month",
    features: [
      "5 Trading Days Free Trial",
      "Diagnostic Assessment & Risk Profile",
      "Personalized Trading Rules",
      "Position Sizing Calculator",
      "Trade Journal + Mistake Detector",
      "Daily Progress Tracker",
      "Self-Challenges (30/60/90 days)",
      "Market Sentiment Engine",
      "End-of-Day Report",
      "Referral Rewards System",
    ],
    badge: null,
  },
  {
    id: "6-month",
    name: "6 Months",
    priceINR: 1836,
    priceUSD: 30,
    period: "/6 mo",
    features: [
      "Everything in Monthly",
      "Challenge History & Analytics",
      "Journal Export (PDF/CSV)",
      "Priority Support",
    ],
    badge: "POPULAR",
    savings: "",
  },
  {
    id: "yearly",
    name: "Yearly",
    priceINR: 3654,
    priceUSD: 48,
    period: "/year",
    features: [
      "Everything in 6-Month plan",
      "All Future Updates",
    ],
    badge: "BEST VALUE",
    savings: "",
  },
];

const loyaltyTiers = [
  { referrals: 3, bonus: "Risk Mentor Badge", badge: "Risk Mentor" },
  { referrals: 5, bonus: "Discipline Influencer Badge", badge: "Discipline Influencer" },
  { referrals: 10, bonus: "Community Builder Badge", badge: "Community Builder" },
];

export default function PaymentsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [currency] = useState<"INR">("INR");
  const [processing, setProcessing] = useState(false);
  const [activeSub, setActiveSub] = useState<Record<string, unknown> | null>(null);
  const supabase = createClient();
  const [aiLimits, setAiLimits] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetch("/api/user/ai-limits")
        .then((res) => res.json())
        .then((data) => setAiLimits(data))
        .catch((err) => console.error("Error fetching AI limits:", err));
    }
  }, [user]);

  // Dynamic pricing state loaded from /api/pricing
  const [prices, setPrices] = useState({
    monthly: 333,
    "6-month": 1836,
    yearly: 3654,
  });

  // Fetch prices from /api/pricing
  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing) {
          setPrices({
            monthly: data.pricing.monthly?.amount || 333,
            "6-month": data.pricing["6-month"]?.amount || 1836,
            yearly: data.pricing.yearly?.amount || 3654,
          });
        }
      })
      .catch(() => { /* use fallback state */ });
  }, []);

  // Compute dynamic plans list
  const dynamicPlans = plans.map((plan) => {
    let price = plan.priceINR;
    let savings = plan.savings;
    if (plan.id === "monthly") {
      price = prices.monthly;
    } else if (plan.id === "6-month") {
      price = prices["6-month"];
      savings = `Save ₹${((prices.monthly * 6) - prices["6-month"]).toLocaleString("en-IN")} compared to monthly`;
    } else if (plan.id === "yearly") {
      price = prices.yearly;
      savings = `Save ₹${((prices.monthly * 12) - prices.yearly).toLocaleString("en-IN")} compared to monthly`;
    }
    return {
      ...plan,
      priceINR: price,
      savings,
    };
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Check active subscription
  useEffect(() => {
    async function checkSub() {
      if (authLoading || !user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();
      setActiveSub(data);
    }
    checkSub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const handleSubscribe = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      const plan = dynamicPlans.find((p) => p.id === selectedPlan)!;
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_order",
          plan: selectedPlan,
        }),
      });
      const data = await res.json();

      if (data.error || !data.order) {
        alert(data.error || "Failed to create order. Please try again.");
        setProcessing(false);
        return;
      }

      // Ensure Razorpay is loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "INTROSPECT™",
        description: `${plan.name} Plan Subscription`,
        order_id: data.order.id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Verify payment
          await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "verify",
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan,
            }),
          });
          // Hard refresh to pick up new subscription
          window.location.href = "/dashboard?payment=success";
        },
        prefill: {
          email: user.email,
          name: profile?.full_name || "",
        },
        theme: { color: "#22c55e" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">
            Choose Your Plan
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Protect your capital and build discipline. Every rupee saved from a
            bad trade pays for INTROSPECT™ many times over.
          </p>
        </motion.div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {dynamicPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const price = plan.priceINR;
          const symbol = "₹";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: plan.id === "yearly" ? 0.1 : 0 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl border-2 p-6 transition-all cursor-pointer ${
                isSelected
                  ? "border-success bg-success/[0.03] ring-2 ring-success/10"
                  : "border-border hover:border-border/80"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-success text-[10px] font-bold text-success-foreground uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold">
                    {plan.name}
                  </h3>
                  {plan.savings && currency === "INR" && (
                    <span className="text-[11px] text-success font-semibold">
                      {plan.savings}
                    </span>
                  )}
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-success bg-success"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>

              <div className="flex items-end gap-1 mb-5">
                <span className="text-3xl font-bold font-heading">
                  {symbol}
                  {price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-muted-foreground mb-0.5">
                  {plan.period}
                </span>
              </div>

              {currency === "INR" && (
                <p className="text-[10px] text-success/70 mb-4">
                  All inclusive pricing
                </p>
              )}

              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Active Subscription Notice */}
      {activeSub && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-success/30 bg-success/[0.06] p-5 text-center">
            <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-sm font-semibold">You have an active {(activeSub.plan as string) || ""} subscription!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Expires: {activeSub.current_period_end ? new Date(activeSub.current_period_end as string).toLocaleDateString("en-IN") : "N/A"}
            </p>
          </div>

          {aiLimits && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden text-left">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/50 bg-muted/20">
                <Zap className="h-4 w-4 text-success" />
                <h3 className="text-sm font-semibold">AI Coaching Plan Quotas</h3>
              </div>
              <div className="divide-y divide-border/50">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">AI Coaching Insights Remaining Today</p>
                    <p className="text-xs text-muted-foreground">EOD summaries and coaching feedback</p>
                  </div>
                  <span className="text-sm font-semibold font-mono text-success">
                    {aiLimits.isAdmin ? "Unlimited (Admin)" : `${aiLimits.daily_insights_remaining} / 5`}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">Weekly Review Available</p>
                    <p className="text-xs text-muted-foreground">In-depth weekly discipline analysis</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    aiLimits.weekly_review_available 
                      ? "bg-success/15 text-success" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {aiLimits.weekly_review_available ? "Available" : "Limit Reached"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">Monthly Review Available</p>
                    <p className="text-xs text-muted-foreground">Comprehensive monthly synthesis</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    aiLimits.monthly_review_available 
                      ? "bg-success/15 text-success" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {aiLimits.monthly_review_available ? "Available" : "Limit Reached"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">Deep Pattern Analyses Remaining</p>
                    <p className="text-xs text-muted-foreground">Psychological trigger breakdown</p>
                  </div>
                  <span className="text-sm font-semibold font-mono text-success">
                    {aiLimits.isAdmin ? "Unlimited (Admin)" : `${aiLimits.deep_patterns_remaining} / 5`}
                  </span>
                </div>
                {!aiLimits.isAdmin && aiLimits.total_monthly_cost >= 20.0 && (
                  <div className="px-5 py-3.5 bg-destructive/10 text-destructive text-xs flex gap-2 items-start">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">AI spending warning threshold reached</p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Your monthly AI cost is at ₹{aiLimits.total_monthly_cost.toFixed(2)} of ₹{aiLimits.hard_limit.toFixed(2)}. New AI insight generation will stop when the cap is reached, but rule-engine alerts and cached feedback remain active.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {!activeSub && (
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={processing}
            className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold px-8 py-3.5 rounded-xl shadow-[0_0_25px_rgba(34,197,94,0.2)] hover:shadow-[0_0_35px_rgba(34,197,94,0.3)] transition-all text-sm cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Subscribe to{" "}
            {plans.find((p) => p.id === selectedPlan)?.name || "Selected"} Plan
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-[10px] text-muted-foreground mt-3">
            Secure payment via Razorpay • Cancel anytime
          </p>
        </div>
      )}

      {/* Loyalty System */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Gift className="h-5 w-5 text-amber-500" />
          <h3 className="font-heading text-base font-bold">
            Referral Rewards Program
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Earn points on REFERRALS. Accumulate{" "}
          <span className="text-foreground font-semibold">
            150 points = 1 free month!
          </span>
        </p>

        <div className="rounded-xl border border-border p-4 mb-6 bg-muted/20 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Each Successful Referral</p>
            <p className="text-xs text-muted-foreground mt-0.5">When referred user subscribes</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold font-heading text-success">+25</p>
            <p className="text-[10px] text-muted-foreground">Points</p>
          </div>
        </div>

        {/* Referral Milestones */}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Referral Milestones
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {loyaltyTiers.map((tier) => (
            <div
              key={tier.referrals}
              className="rounded-xl border border-border p-3 text-center"
            >
              <Crown className="h-4 w-4 text-amber-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold">{tier.badge}</p>
              <p className="text-[10px] text-muted-foreground">
                {tier.referrals} referrals • {tier.bonus}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          5 trading days free trial available for new monthly subscriptions. Points expire after 24 months. Maximum
          1 free month redemption per renewal cycle. Referral rewards
          activate only after the referred user completes payment.
        </p>
      </div>
    </div>
  );
}
