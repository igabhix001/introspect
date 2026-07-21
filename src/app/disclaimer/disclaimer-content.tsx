"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Shield, CheckCircle2, Info, BookOpen, AlertOctagon } from "lucide-react";

const sections = [
  {
    icon: AlertTriangle,
    title: "1. Not Financial or Investment Advice",
    content: [
      "INTROSPECT™ (operated by Intraday MindView Learning) provides self-tracking software, behavioral risk scoring, and educational risk management calculators.",
      "None of the content, scores, daily reports, AI coach messages, or tools constitute financial advice, investment recommendations, or trading signals.",
      "INTROSPECT™ is not a SEBI-registered Investment Advisor (RIA), Research Analyst, Portfolio Manager, or Stock Broker.",
      "All users should consult a qualified financial advisor before executing trades in financial markets.",
    ],
  },
  {
    icon: AlertOctagon,
    title: "2. High Risk of Intraday & Options Trading",
    content: [
      "Trading in equities, futures, options, commodities, and currencies involves substantial risk of capital loss.",
      "According to official SEBI studies, over 89% of individual retail traders in the Futures & Options (F&O) segment incur net financial losses.",
      "Derivatives and leveraged trading can result in losses exceeding your initial deposit.",
      "Do not trade with money you cannot afford to lose completely.",
    ],
  },
  {
    icon: Shield,
    title: "3. Educational & Behavioral Scope",
    content: [
      "INTROSPECT™ focuses strictly on psychological discipline, position sizing mathematics, and rule adherence.",
      "Our software helps traders manage emotional triggers like revenge trading, overtrading, and FOMO.",
      "We do not guarantee profits, win rates, or protection against market volatility.",
      "Historical discipline scores or past performance analytics do not guarantee future trading outcomes.",
    ],
  },
  {
    icon: BookOpen,
    title: "4. Third-Party Links & Advertising Disclosure",
    content: [
      "Our website and free public pages may display third-party advertisements served via Google AdSense.",
      "We do not endorse, guarantee, or take responsibility for third-party products or services advertised on our site.",
      "Clicking on third-party links or advertisements will direct you outside INTROSPECT™.",
      "Logged-in active Pro subscribers receive a 100% ad-free experience.",
    ],
  },
];

export function DisclaimerContent() {
  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-500 mb-2">
            Regulatory & Legal Notice
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Disclaimer & Risk Warning
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Please read this disclaimer carefully before using INTROSPECT™ software, calculators, or educational content.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-muted border border-border">
                    <Icon className="h-5 w-5 text-amber-500" />
                  </div>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 rounded-2xl bg-muted/30 border border-border/40 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Have questions about our regulatory compliance or legal disclosures? Contact our team at{" "}
            <a href="mailto:intradaymindview@gmail.com" className="text-success underline font-semibold">
              intradaymindview@gmail.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
