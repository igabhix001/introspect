"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Check, Star, ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: "333",
    period: "/month",
    description: "Perfect for getting started with trading discipline.",
    features: [
      "Full Risk Assessment",
      "Personalized Trading Rules",
      "Position Sizing Calculator",
      "Trade Journal + Mistake Detector",
      "Daily Progress Tracker",
      "30-Day Challenges",
      "End-of-Day Reports",
      "Market Sentiment (Nifty)",
    ],
    cta: "Start Monthly",
    popular: false,
  },
  {
    id: "6-month",
    name: "6 Months",
    price: "1,836",
    period: "/6 mo",
    monthlyEquivalent: "₹306/month",
    savings: null,
    description: "Build serious consistency with medium-term commitment.",
    features: [
      "Everything in Monthly plan",
      "60-Day Challenges",
      "Challenge History & Analytics",
      "Journal Export (PDF/CSV)",
      "Priority Support",
      "Loyalty Points (75 pts on sub)",
    ],
    cta: "Start 6 Months",
    popular: true,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "3,654",
    period: "/year",
    monthlyEquivalent: "Only ₹304/month",
    savings: "Best Value",
    description: "Commit to discipline. Build lasting habits over a full year.",
    features: [
      "Everything in 6-Month plan",
      "90-Day Challenges",
      "Loyalty Points (150 pts = 1 free month)",
      "Referral Rewards",
      "All Future Updates",
    ],
    cta: "Start Yearly",
    popular: false,
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-success/5 rounded-full blur-[150px] pointer-events-none" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
            Pricing
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Invest in Your{" "}
            <span className="gradient-text">Discipline</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-base sm:text-lg">
            Less than a single bad trade costs you. Protect your capital with
            personalized risk management.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative group"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-success text-success-foreground font-semibold px-4 py-1 rounded-full shadow-lg shadow-success/20">
                    <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                    Best Value
                  </Badge>
                </div>
              )}

              <div
                className={`relative h-full p-8 sm:p-10 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? "bg-card border-success/30 shadow-xl shadow-success/5"
                    : "bg-card/50 border-border/50 hover:border-border glass-card"
                }`}
              >
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="font-heading text-xl font-bold mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <span className="font-heading text-5xl font-extrabold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>

                  {plan.monthlyEquivalent && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Effectively {plan.monthlyEquivalent}
                      </span>
                      {plan.savings && (
                        <Badge
                          variant="outline"
                          className="text-success border-success/30 text-xs"
                        >
                          {plan.savings}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/pricing"
                  className={`flex items-center justify-center w-full font-semibold py-4 rounded-xl cursor-pointer group/btn transition-all duration-300 ${
                    plan.popular
                      ? "bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {plan.popular && (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          Secure payment via Razorpay (India) / Stripe (International).
          Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
