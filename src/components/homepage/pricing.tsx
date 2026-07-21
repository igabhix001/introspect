"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

interface PlanItem {
  id: "monthly" | "6-month" | "yearly";
  name: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  badge: string | null;
  href: string;
}

export default function PricingSection() {
  const [prices, setPrices] = useState({
    monthly: { amount: 333 },
    "6-month": { amount: 1836 },
    yearly: { amount: 3654 },
  });

  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing) {
          setPrices(data.pricing);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch dynamic pricing, using fallbacks:", err);
      });
  }, []);

  const getPriceDisplay = (planId: "free" | "monthly" | "6-month" | "yearly") => {
    if (planId === "free") return "₹0";
    const amount = prices[planId]?.amount ?? 0;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const pricingPlans: PlanItem[] = [
    {
      id: "free" as any,
      name: "INTROSPECT STARTER (Free)",
      period: "/forever",
      description: "Essential tools to build discipline. 100% Free.",
      features: [
        "ATR Position Sizer & Calculator",
        "Live Market Sentiment Engine",
        "Diagnostic Assessment & Basic Score",
        "Today's EOD Daily Summary Report",
        "Trade Journal (Up to 50 entries)",
        "30/60/90 Day Discipline Challenges",
      ],
      cta: "Get Started Free",
      badge: "FREE FOREVER",
      href: "/auth/signup",
    },
    {
      id: "monthly",
      name: "INTROSPECT PRO (Monthly)",
      period: "/month",
      description: "Full AI features & ad-free experience. Cancel anytime.",
      features: [
        "Full AI Risk Report & Archetype Matrix",
        "Interactive AI Coach & Guidance",
        "Unlimited Trade Journal Storage",
        "Advanced Analytics & Equity Curve",
        "Past Historical Daily Reports",
        "100% Ad-Free Clean Experience",
      ],
      cta: "Start Monthly Pro",
      badge: null,
      href: "/auth/signup?plan=monthly",
    },
    {
      id: "6-month",
      name: "INTROSPECT PRO (6 Months)",
      period: "/6 mo",
      description: "Build consistent discipline habits.",
      features: [
        "Everything in Monthly plan",
        "Challenge History & Deep Analytics",
        "Journal Export (PDF/CSV)",
        "Priority Email Support",
        `Save ₹${((prices.monthly.amount * 6) - prices["6-month"].amount).toLocaleString("en-IN")} compared to monthly`,
      ],
      cta: "Get 6 Months Access",
      badge: "POPULAR",
      href: "/auth/signup?plan=6-month",
    },
    {
      id: "yearly",
      name: "INTROSPECT ELITE (Yearly)",
      period: "/year",
      description: "Commit to trading mastery & consistency.",
      features: [
        "Everything in 6 Months plan",
        "All Future Features & Updates",
        "Elite Discord Community Access",
        "Direct Priority Support Channel",
        `Save ₹${((prices.monthly.amount * 12) - prices.yearly.amount).toLocaleString("en-IN")} compared to monthly`,
      ],
      cta: "Get Elite Yearly Access",
      badge: "BEST VALUE",
      href: "/auth/signup?plan=yearly",
    },
  ];

  return (
    <section className="py-24 bg-muted/20 border-t border-border" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-success uppercase tracking-widest">
            Pricing Options
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Daily Discipline Infrastructure
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Invest in your execution habits, not just your margin. Every rupee saved from a bad trade pays for INTROSPECT™ many times over.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {pricingPlans.map((plan) => {
            const isPopular = plan.badge === "POPULAR";
            const isBestValue = plan.badge === "BEST VALUE";
            return (
              <div
                key={plan.id}
                className={`bg-card rounded-3xl p-8 border flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all duration-300 ${
                  isPopular ? "border-success/40 ring-1 ring-success/15 md:scale-[1.03] z-10" : "border-border/80"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-success text-[9px] font-bold text-success-foreground uppercase tracking-widest">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-base text-foreground tracking-tight">{plan.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2">
                    <span className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground">
                      {getPriceDisplay(plan.id)}
                    </span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>

                  <ul className="space-y-2.5 border-t border-border pt-6">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex gap-2 items-center text-xs text-muted-foreground">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8 mt-auto">
                  <Link
                    href={plan.href}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all select-none ${
                      isPopular || isBestValue
                        ? "bg-success text-success-foreground hover:bg-success/90"
                        : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
