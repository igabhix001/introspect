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
import { createClient } from "@/lib/supabase/client";
import { trackSubscribeClick, trackSubscriptionSuccess } from "@/components/analytics";

const allFeatures = [
  { name: "Full Risk Assessment & Scoring", monthly: true, sixMonth: true, yearly: true },
  { name: "Personalized Trading Rules", monthly: true, sixMonth: true, yearly: true },
  { name: "Position Sizing Calculator", monthly: true, sixMonth: true, yearly: true },
  { name: "Trade Journal + Mistake Detector", monthly: true, sixMonth: true, yearly: true },
  { name: "Daily Progress Tracker", monthly: true, sixMonth: true, yearly: true },
  { name: "Self-Challenges (30/60/90 days)", monthly: true, sixMonth: true, yearly: true },
  { name: "End-of-Day Reports & Coaching", monthly: true, sixMonth: true, yearly: true },
  { name: "Market Sentiment (Nifty/BankNifty)", monthly: true, sixMonth: true, yearly: true },
  { name: "Pro Tips & Alerts", monthly: true, sixMonth: true, yearly: true },
  { name: "Referral Rewards System", monthly: true, sixMonth: true, yearly: true },
  { name: "Challenge History & Analytics", monthly: false, sixMonth: true, yearly: true },
  { name: "Journal Export (PDF/CSV)", monthly: false, sixMonth: true, yearly: true },
  { name: "Priority Support", monthly: false, sixMonth: true, yearly: true },
  { name: "Loyalty Points (earn free months)", monthly: "10 pts", sixMonth: "75 pts", yearly: "150 pts" },
  { name: "All Future Feature Updates", monthly: false, sixMonth: false, yearly: true },
];

const loyaltyInfo = [
  { action: "Annual Purchase", points: 150 },
  { action: "Annual Renewal", points: 150 },
  { action: "6-Month Purchase", points: 75 },
  { action: "Monthly Renewal", points: 10 },
  { action: "Referral (after payment)", points: 25 },
];

const referralBadges = [
  { referrals: 3, badge: "Risk Mentor", bonus: "+20 points" },
  { referrals: 5, badge: "Discipline Influencer", bonus: "+50 points" },
  { referrals: 10, badge: "Community Builder", bonus: "+100 points" },
];

const pricingFAQs = [
  {
    q: "Is there a free trial?",
    a: "We don't currently offer a free trial, but our monthly plan has no lock-in — you can cancel anytime after exploring the tool.",
  },
  {
    q: "How does the loyalty program work?",
    a: "Every action earns you loyalty points. When you reach 150 points, you get 1 free month of access. Points expire after 24 months. Annual subscribers earn 150 points immediately!",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI, credit/debit cards, net banking via Razorpay. All inclusive pricing — no hidden charges.",
  },
  {
    q: "Can I switch from monthly to yearly?",
    a: "Yes! You can upgrade to yearly at any time. The remaining value of your current month will be prorated.",
  },
  {
    q: "What happens when I cancel?",
    a: "Your access continues until the end of the current billing period. Your data (trade journal, challenge history) is preserved for 90 days in case you resubscribe.",
  },
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function PricingContent() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

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
    trackSubscribeClick("pricing_page", plan);

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

      // Step 3: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "INTROSPECT™",
        description: `${plan === "monthly" ? "Monthly" : plan === "6-month" ? "6-Month" : "Yearly"} Subscription`,
        order_id: data.order.id,
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          // Step 4: Verify payment
          await fetch("/api/payments", {
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
          
          // Track successful subscription in GA4
          const amountMap = { monthly: 333, "6-month": 1836, yearly: 3654 };
          trackSubscriptionSuccess(plan, amountMap[plan]);
          
          // Clear referral code after successful payment
          try {
            localStorage.removeItem("introspect_referral");
          } catch (e) {
            console.warn("Failed to clear referral code:", e);
          }
          window.location.href = "/dashboard?payment=success";
        },
        prefill: {},
        theme: { color: "#22c55e" },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
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
                <span className="font-heading text-5xl font-extrabold">333</span>
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
                <span className="font-heading text-5xl font-extrabold">1,836</span>
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
                  Only ₹304/mo
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm text-muted-foreground">₹</span>
                <span className="font-heading text-5xl font-extrabold">3,654</span>
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
            <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-muted/30 border-b border-border/50">
              <span className="text-sm font-semibold">Feature</span>
              <span className="text-sm font-semibold text-center">Monthly</span>
              <span className="text-sm font-semibold text-center">6-Month</span>
              <span className="text-sm font-semibold text-center">Yearly</span>
            </div>

            {allFeatures.map((feature, i) => (
              <div
                key={feature.name}
                className={`grid grid-cols-4 gap-4 px-6 py-3.5 items-center ${
                  i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                } ${i < allFeatures.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <span className="text-sm">{feature.name}</span>
                <div className="flex justify-center">
                  {feature.monthly === true ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : feature.monthly ? (
                    <span className="text-sm font-medium">{feature.monthly}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.sixMonth === true ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : feature.sixMonth ? (
                    <span className="text-sm font-medium text-success">{feature.sixMonth}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.yearly === true ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : feature.yearly ? (
                    <span className="text-sm font-medium text-success">{feature.yearly}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Loyalty Program */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="rounded-2xl bg-card/50 border border-border/50 glass-card p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Gift className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold">
                Loyalty Program
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              <strong>150 points = 1 free month.</strong> Earn points with every
              action. Points expire after 24 months.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {loyaltyInfo.map((item) => (
                <div
                  key={item.action}
                  className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center"
                >
                  <p className="font-heading text-2xl font-bold text-success">
                    +{item.points}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.action}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-success" />
              Referral Milestones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {referralBadges.map((item) => (
                <div
                  key={item.badge}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30"
                >
                  <Users className="h-5 w-5 text-success flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{item.badge}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.referrals} referrals • {item.bonus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

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
            Pricing FAQ
          </h2>

          <Accordion className="space-y-3">
            {pricingFAQs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={i}
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
