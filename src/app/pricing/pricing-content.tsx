"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  Star,
  ArrowRight,
  Zap,
  Gift,
  Users,
  Award,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/toast";
import { AdBanner } from "@/components/ads/google-adsense";

import { createClient } from "@/lib/supabase/client";
import { trackSubscribeClick, trackPaymentInitiated, trackPurchase } from "@/lib/analytics";

const allFeatures = [
  { name: "Position Sizing & ATR Calculator", free: true, monthly: true, sixMonth: true, yearly: true },
  { name: "Live Market Sentiment Engine", free: true, monthly: true, sixMonth: true, yearly: true },
  { name: "30 / 60 / 90 Day Self-Challenges", free: true, monthly: true, sixMonth: true, yearly: true },
  { name: "Community Reward Points & Badges", free: true, monthly: true, sixMonth: true, yearly: true },
  { name: "Diagnostic Assessment", free: "Basic Score", monthly: "Full Report", sixMonth: "Full Report", yearly: "Full Report" },
  { name: "Trade Journal Capacity", free: "50 Trades Cap", monthly: "Unlimited", sixMonth: "Unlimited", yearly: "Unlimited" },
  { name: "End-of-Day Daily Summary Reports", free: "Today Only", monthly: "Full History", sixMonth: "Full History", yearly: "Full History" },
  { name: "Interactive AI CBT Coach", free: false, monthly: true, sixMonth: true, yearly: true },
  { name: "AI Risk Archetype Matrix & Radar", free: false, monthly: true, sixMonth: true, yearly: true },
  { name: "Behavioral Analytics & Equity Curve", free: false, monthly: true, sixMonth: true, yearly: true },
  { name: "Journal Export to Excel & PDF", free: false, monthly: false, sixMonth: true, yearly: true },
  { name: "Ad-Free Clean Experience", free: "Ad-Supported", monthly: "100% Ad-Free", sixMonth: "100% Ad-Free", yearly: "100% Ad-Free" },
  { name: "Priority Support & Updates", free: false, monthly: false, sixMonth: true, yearly: true },
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface PricingData {
  monthly: { amount: number; amount_paise: number };
  "6-month": { amount: number; amount_paise: number };
  yearly: { amount: number; amount_paise: number };
}

const DEFAULT_PRICES: PricingData = {
  monthly: { amount: 333, amount_paise: 33300 },
  "6-month": { amount: 1836, amount_paise: 183600 },
  yearly: { amount: 3654, amount_paise: 365400 },
};

export function PricingContent() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [prices, setPrices] = useState<PricingData>(DEFAULT_PRICES);
  const router = useRouter();
  const { showToast } = useToast();

  const pricingFAQs = [
    {
      q: "Is there a free tier?",
      a: "Yes! Core utility tools (Position Sizer, Sentiment Engine, Basic Assessment Score, Today's Daily Report, and 50 journal entries) are 100% Free Forever. Upgrade to Pro for AI features, full risk reports, unlimited journaling, and an ad-free experience.",
    },
    {
      q: "Do I need to connect my broker?",
      a: "No. INTROSPECT™ works completely independently. No broker connection needed.",
    },
    {
      q: "Can I switch or cancel my plan?",
      a: "Yes. Upgrade, downgrade, or cancel anytime from your dashboard. Monthly plans have no lock-in.",
    },
    {
      q: "Is there a discount for paying annually?",
      a: `Yes. Yearly plan is ₹${prices.yearly.amount.toLocaleString("en-IN")}/year - just ₹${Math.round(prices.yearly.amount / 12).toLocaleString("en-IN")}/month. Compared to paying monthly (₹${prices.monthly.amount.toLocaleString("en-IN")} × 12 = ₹${(prices.monthly.amount * 12).toLocaleString("en-IN")}), you save ₹${((prices.monthly.amount * 12) - prices.yearly.amount).toLocaleString("en-IN")}. That's almost 2 months free.`,
    },
    {
      q: "Do you have a referral program?",
      a: "Yes! Refer a friend who subscribes and earn 25 referral points. Accumulate 150 points to redeem 1 free month. Points can only be earned via referrals.",
    },
    {
      q: "Can I use INTROSPECT™ with any trading platform?",
      a: "Yes. Platform-independent. Works alongside any broker or trading software.",
    },
  ];

  // Fetch dynamic pricing from admin settings
  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing) setPrices(data.pricing);
      })
      .catch(() => { /* use defaults */ });
  }, []);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasSubscription(false);
        return;
      }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("current_period_end", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      setHasSubscription(!!sub);
    };
    checkSubscription();
  }, []);

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (hasSubscription === false) {
      e.preventDefault();
      showToast("You need to subscribe before using the tool.", "warning", 5000);
    }
  };

  const handleSubscribe = async (plan: "monthly" | "6-month" | "yearly") => {
    setLoadingPlan(plan);

    // Track subscribe button click in GA4
    trackSubscribeClick('pricing_page', plan);

    try {
      // Get referral code from localStorage if present
      let referralCode: string | null = null;
      try {
        const referralData = localStorage.getItem("introspect_referral");
        if (referralData) {
          const parsed = JSON.parse(referralData);
          // Only use referral if it's less than 30 days old
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
          if (Date.now() - parsed.timestamp < thirtyDaysMs) {
            referralCode = parsed.code;
          }
        }
      } catch (e) {
        console.warn("Failed to read referral code:", e);
      }

      // Step 1: Create Razorpay order via API
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_order", plan, referral_code: referralCode }),
      });
      const data = await res.json();

      if (data.error === "Unauthorized" || res.status === 401) {
        router.push("/auth/login?redirect=/pricing");
        return;
      }

      if (data.error || !data.order) {
        alert(data.error || "Failed to create order. Please try again.");
        setLoadingPlan(null);
        return;
      }

      // Step 2: Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      // Track payment initiation in GA4
      const amountInRupees = data.order.amount / 100; // Convert paise to rupees
      trackPaymentInitiated(plan, amountInRupees);

      // Step 3: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "INTROSPECT™",
        description: `${plan === "monthly" ? "Monthly" : plan === "6-month" ? "6-Month" : "Yearly"} Subscription`,
        order_id: data.order.id,
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          // Track successful purchase in GA4
          trackPurchase(response.razorpay_order_id, plan, amountInRupees);

          // Step 4: Verify payment (frontend verification as backup to webhook)
          try {
            const verifyRes = await fetch("/api/payments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "verify",
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan,
                referral_code: referralCode,
              }),
            });
            
            if (!verifyRes.ok) {
              console.warn("[Payment] Frontend verification failed, webhook will handle it");
            }
          } catch (verifyErr) {
            // Don't block redirect - webhook will handle subscription creation
            console.warn("[Payment] Verification request failed, webhook will handle:", verifyErr);
          }

          // Clear referral code after successful payment
          try {
            localStorage.removeItem("introspect_referral");
          } catch (e) {
            console.warn("Failed to clear referral code:", e);
          }

          // Force a small delay to allow webhook to process, then redirect
          // This ensures subscription is active before dashboard loads
          setTimeout(() => {
            window.location.href = "/dashboard?payment=success";
          }, 1500);
        },
        modal: {
          ondismiss: function() {
            console.log("[Razorpay] Modal dismissed by user");
            setLoadingPlan(null);
          },
          escape: false, // Prevent accidental close on mobile
          confirm_close: true, // Ask before closing
        },
        prefill: {},
        theme: { color: "#22c55e" },
        retry: { enabled: true, max_count: 3 }, // Allow retries on failure
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
            Simple Pricing
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Invest in Your{" "}
            <span className="gradient-text">Discipline</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Less than a single bad trade costs you. No hidden fees, no lock-in
            contracts.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
          {/* Forever Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <div className="relative h-full p-6 rounded-2xl bg-card/40 border border-border/50 glass-card hover:border-border transition-all duration-300 flex flex-col justify-between">
              <div>
                <Badge variant="outline" className="border-success/30 text-success bg-success/5 font-semibold mb-3">
                  100% Free Forever
                </Badge>
                <h3 className="font-heading text-xl font-bold mb-1">Starter Free</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Essential tools to build discipline. No credit card required.
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-sm font-semibold text-muted-foreground">₹</span>
                  <span className="font-heading text-4xl font-extrabold text-foreground">0</span>
                  <span className="text-xs text-muted-foreground">/forever</span>
                </div>

                <ul className="space-y-2.5 mb-6 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>Position Sizer & ATR Calculator</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>Live Market Sentiment Engine</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>Basic Assessment Score</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>Today's EOD Daily Report</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>Trade Journal (Up to 50 entries)</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>30/60/90 Day Challenges</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/auth/signup"
                className="flex items-center justify-center w-full font-semibold py-3.5 rounded-xl border border-border hover:bg-muted text-foreground cursor-pointer text-xs transition-colors"
              >
                Get Started Free
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
          {/* Monthly */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative h-full p-8 sm:p-10 rounded-2xl bg-card/50 border border-border/50 glass-card hover:border-border transition-all duration-300">
              <h3 className="font-heading text-xl font-bold mb-2">Monthly</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Perfect for getting started.
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm text-muted-foreground">₹</span>
                <span className="font-heading text-5xl font-extrabold">{prices.monthly.amount.toLocaleString("en-IN")}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={loadingPlan === "monthly"}
                className="flex items-center justify-center w-full font-semibold py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer group transition-colors disabled:opacity-60"
              >
                {loadingPlan === "monthly" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Start Monthly
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* 6-Month */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="relative h-full p-8 sm:p-10 rounded-2xl bg-card border border-success/30 shadow-xl shadow-success/5 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-success text-success-foreground font-semibold px-4 py-1 rounded-full shadow-lg shadow-success/20">
                  <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                  Popular
                </Badge>
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">6 Months</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Build serious consistency.
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm text-muted-foreground">₹</span>
                <span className="font-heading text-5xl font-extrabold">{prices["6-month"].amount.toLocaleString("en-IN")}</span>
                <span className="text-muted-foreground">/6 mo</span>
              </div>

              <button
                onClick={() => handleSubscribe("6-month")}
                disabled={loadingPlan === "6-month"}
                className="flex items-center justify-center w-full font-semibold py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer group transition-colors disabled:opacity-60 shadow-lg"
              >
                {loadingPlan === "6-month" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Start 6 Months
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Yearly */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-success text-success-foreground font-semibold px-4 py-1 rounded-full shadow-lg shadow-success/20">
                <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Best Value
              </Badge>
            </div>

            <div className="relative h-full p-8 sm:p-10 rounded-2xl bg-card border border-success/30 shadow-xl shadow-success/5">
              <h3 className="font-heading text-xl font-bold mb-2">Yearly</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Commit to discipline for a full year.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="outline" className="text-success border-success/30 text-xs">
                  Best Value
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Only ₹{Math.round(prices.yearly.amount / 12).toLocaleString("en-IN")}/mo
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm text-muted-foreground">₹</span>
                <span className="font-heading text-5xl font-extrabold">{prices.yearly.amount.toLocaleString("en-IN")}</span>
                <span className="text-muted-foreground">/year</span>
              </div>

              <button
                onClick={() => handleSubscribe("yearly")}
                disabled={loadingPlan === "yearly"}
                className="flex items-center justify-center w-full font-semibold py-4 rounded-xl bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20 cursor-pointer group transition-colors disabled:opacity-60"
              >
                {loadingPlan === "yearly" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Yearly
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-10">
            Feature Comparison
          </h2>

          <div className="rounded-2xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 py-4 bg-muted/30 border-b border-border/50 text-xs sm:text-sm font-semibold">
              <span>Feature</span>
              <span className="text-center text-muted-foreground">Free</span>
              <span className="text-center">Monthly</span>
              <span className="text-center">6-Month</span>
              <span className="text-center">Yearly</span>
            </div>

            {allFeatures.map((feature, i) => (
              <div
                key={feature.name}
                className={`grid grid-cols-5 gap-2 px-4 py-3.5 items-center text-xs sm:text-sm ${
                  i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                } ${i < allFeatures.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <span className="font-medium text-foreground">{feature.name}</span>
                <div className="flex justify-center text-center">
                  {feature.free === true ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : feature.free ? (
                    <span className="text-xs font-medium text-amber-500">{feature.free}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </div>
                <div className="flex justify-center text-center">
                  {feature.monthly === true ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : feature.monthly ? (
                    <span className="text-xs font-medium text-foreground">{feature.monthly}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </div>
                <div className="flex justify-center text-center">
                  {feature.sixMonth === true ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : feature.sixMonth ? (
                    <span className="text-xs font-medium text-success">{feature.sixMonth}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </div>
                <div className="flex justify-center text-center">
                  {feature.yearly === true ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : feature.yearly ? (
                    <span className="text-xs font-medium text-success">{feature.yearly}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>


        {/* Value Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-10">
            Before vs After INTROSPECT™
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without INTROSPECT */}
            <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.02] p-6 space-y-4">
              <h3 className="font-heading text-lg font-bold text-destructive flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                Without INTROSPECT
              </h3>
              <ul className="space-y-3.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Emotional trading decisions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Random position sizing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>No mistake tracking</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Trading against market trend</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>No trading psychology profile</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span className="font-medium text-foreground">₹10,000+ monthly losses possible</span>
                </li>
              </ul>
            </div>

            {/* With INTROSPECT */}
            <div className="rounded-2xl border border-success/30 bg-success/[0.02] p-6 space-y-4 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
              <h3 className="font-heading text-lg font-bold text-success flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                With INTROSPECT
              </h3>
              <ul className="space-y-3.5 text-sm text-foreground/90">
                <li className="flex items-center gap-2.5">
                  <span className="text-success font-bold">✓</span>
                  <span>Data-driven discipline system</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-success font-bold">✓</span>
                  <span>ATR-based position calculator</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-success font-bold">✓</span>
                  <span>Automated behavioural leak detection</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-success font-bold">✓</span>
                  <span>Real-time NIFTY sentiment alignment</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-success font-bold">✓</span>
                  <span>AI-powered risk assessment & archetype</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-success font-bold">✓</span>
                  <span className="font-semibold text-success">Starts at just ₹{prices.monthly.amount.toLocaleString("en-IN")}/month</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* AdBanner */}
        <div className="max-w-3xl mx-auto my-10">
          <AdBanner slot="1992174832" format="auto" />
        </div>

        {/* FAQ */}
        <motion.div

          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          id="faq"
          className="max-w-3xl mx-auto"
        >
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-10 flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-success" />
            Frequently Asked Questions
          </h2>

          <Accordion className="space-y-3">
            {pricingFAQs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={i.toString()}
                className="border border-border/50 rounded-xl px-5 data-[state=open]:bg-card/50 transition-colors"
              >
                <AccordionTrigger className="text-sm font-medium hover:no-underline cursor-pointer py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
}
