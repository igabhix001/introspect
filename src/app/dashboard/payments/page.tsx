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
    priceUSD: 4,
    period: "/month",
    features: [
      "Diagnostic Assessment & Risk Profile",
      "Personalized Trading Rules",
      "Position Sizing Calculator",
      "Trade Journal + Mistake Detector",
      "Daily Progress Tracker",
      "Self-Challenges (30/60/90 days)",
      "Market Sentiment Engine",
      "End-of-Day Report",
      "Referral Rewards System",
      "10 Loyalty Points per renewal",
    ],
    badge: null,
  },
  {
    id: "6-month",
    name: "6 Months",
    priceINR: 1836,
    priceUSD: 22,
    period: "/6 mo",
    features: [
      "Everything in Monthly",
      "Challenge History & Analytics",
      "Journal Export (PDF/CSV)",
      "Priority Support",
      "75 Loyalty Points on purchase",
    ],
    badge: "POPULAR",
    savings: "₹306/month",
  },
  {
    id: "yearly",
    name: "Yearly",
    priceINR: 3654,
    priceUSD: 44,
    period: "/year",
    features: [
      "Everything in 6-Month plan",
      "150 Loyalty Points (= 1 free month)",
      "All Future Updates",
    ],
    badge: "BEST VALUE",
    savings: "₹304/month",
  },
];

const loyaltyTiers = [
  { referrals: 3, bonus: "+20 pts", badge: "Risk Mentor" },
  { referrals: 5, bonus: "+50 pts", badge: "Discipline Influencer" },
  { referrals: 10, bonus: "+100 pts", badge: "Community Builder" },
];

export default function PaymentsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [currency] = useState<"INR">("INR");
  const [processing, setProcessing] = useState(false);
  const [activeSub, setActiveSub] = useState<Record<string, unknown> | null>(null);
  const supabase = createClient();

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
      const plan = plans.find((p) => p.id === selectedPlan)!;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plans.map((plan) => {
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
        <div className="rounded-2xl border border-success/30 bg-success/[0.06] p-5 text-center">
          <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
          <p className="text-sm font-semibold">You have an active {(activeSub.plan as string) || ""} subscription!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Expires: {activeSub.current_period_end ? new Date(activeSub.current_period_end as string).toLocaleDateString("en-IN") : "N/A"}
          </p>
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
            {selectedPlan === "monthly" ? "Monthly" : "Yearly"} Plan
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
            Loyalty Rewards Program
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Earn points with every purchase and referral.{" "}
          <span className="text-foreground font-semibold">
            150 points = 1 free month!
          </span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold font-heading text-success">150</p>
            <p className="text-[10px] text-muted-foreground">
              Annual Purchase
            </p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold font-heading text-success">150</p>
            <p className="text-[10px] text-muted-foreground">
              Annual Renewal
            </p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold font-heading text-amber-500">25</p>
            <p className="text-[10px] text-muted-foreground">Per Referral</p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold font-heading text-blue-500">10</p>
            <p className="text-[10px] text-muted-foreground">
              Monthly Renewal
            </p>
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
          No free trial available. Points expire after 24 months. Maximum
          1 free month redemption per renewal cycle. Referral rewards
          activate only after the referred user completes payment.
        </p>
      </div>
    </div>
  );
}
