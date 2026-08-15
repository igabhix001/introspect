"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Target,
  Heart,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Users,
  Award,
} from "lucide-react";
import { YouTubeEmbed } from "@/components/ui/youtube-embed";
import { AdBanner } from "@/components/ads/google-adsense";

const whyIBuiltThis = {
  intro: "I didn't struggle with finding a strategy.",
  struggle: "I struggled with following it.",
  points: [
    "I knew where to enter.",
    "I knew where to exit.",
    "But I still broke my stop-loss.",
    "Still overtraded.",
    "Still gave profits back.",
  ],
  realization: "Not because I didn't know — but because I couldn't stay disciplined.",
  insight: "Most traders don't fail because of strategy. They fail because they can't follow their own rules.",
  solution: "So I built INTROSPECT™. Something simple that shows where I break my rules, helps me control risk, and keeps me accountable.",
  closing: "It's not a strategy. It just helps you do what you already know — but consistently.",
};

const values = [
  {
    icon: Shield,
    title: "Capital Protection First",
    description:
      "We believe the first rule of trading is to protect what you have. Every feature in INTROSPECT™ is designed around this principle.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Target,
    title: "Discipline Over Strategy",
    description:
      "The best strategy means nothing without discipline. We focus on building the habits that separate consistent traders from the 90%.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Heart,
    title: "Emotional Awareness",
    description:
      "Trading is emotional. We help you recognize patterns of revenge trading, overconfidence, and fear — then give you tools to manage them.",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Lightbulb,
    title: "Data-Driven Insights",
    description:
      "No guesswork. Every recommendation is based on your actual trading behavior, analyzed across 5 risk categories with scoring logic.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
];

const milestones = [
  { icon: BookOpen, label: "Research & Development", detail: "2 years of trading psychology research" },
  { icon: Users, label: "Community Focus", detail: "Built for Indian market traders (Nifty, BankNifty)" },
  { icon: Award, label: "Trademark Registered", detail: "INTROSPECT™ is a registered trademark" },
];

export function AboutContent() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div className="pt-32 pb-20">
      {/* Why I Built This - Personal Story */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-success/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
              Why I Built This
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              {whyIBuiltThis.intro}
              <br />
              <span className="gradient-text">{whyIBuiltThis.struggle}</span>
            </h1>
            
            <div className="space-y-4 mb-8">
              {whyIBuiltThis.points.map((point, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="text-lg text-muted-foreground"
                >
                  {point}
                </motion.p>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-xl font-medium text-foreground mb-6"
            >
              {whyIBuiltThis.realization}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="p-6 rounded-2xl bg-success/5 border border-success/20 mb-8"
            >
              <p className="text-lg font-semibold text-success mb-2">
                That&apos;s when I realized:
              </p>
              <p className="text-xl text-foreground">
                {whyIBuiltThis.insight}
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="text-lg text-muted-foreground mb-4"
            >
              {whyIBuiltThis.solution}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-lg font-medium text-foreground italic"
            >
              {whyIBuiltThis.closing}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="mt-8"
            >
              <Link
                href="/dashboard/assessment"
                className="group inline-flex items-center bg-success hover:bg-success/90 text-success-foreground font-bold px-8 py-4 rounded-xl shadow-lg shadow-success/20 transition-all duration-300 cursor-pointer"
              >
                Start Your Assessment
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Logo + Mission */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(34,197,94,0.15)] bg-black/40">
              <video
                src="/Manage money.webm"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover relative z-10"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6">
              Our Mission
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              INTROSPECT™ exists for one reason: to give intraday traders the tools
              and discipline framework they need to stop losing capital and start
              trading with a clear system — one accountable session at a time.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We started with the Indian market (Nifty 50, BankNifty) because the
              data is stark. SEBI studies show 90%+ of retail F&O traders lose money,
              with average losses of ₹1.1 Lakh. The problem is not strategy — it is
              execution discipline. That is the gap we close.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our goal: every intraday trader, everywhere, has access to a personal
              behavioral risk guardian.
            </p>

            <div className="flex flex-wrap gap-4">
              {milestones.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm"
                >
                  <m.icon className="h-4 w-4 text-success" />
                  <span className="font-medium">{m.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-background via-muted/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-72 h-72 bg-success/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-success/3 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <YouTubeEmbed
            videoId="nvLK9HtIJk0"
            title="See INTROSPECT in Action"
            subtitle="Watch how traders are transforming their discipline and achieving consistent results."
            isShort={true}
          />
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            What We <span className="gradient-text">Believe In</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 sm:p-8 rounded-2xl bg-card/50 border border-border/50 glass-card hover:border-success/30 hover:shadow-[0_0_25px_rgba(34,197,94,0.08)] transition-all duration-300 group cursor-pointer"
            >
              <div className={`inline-flex p-3 rounded-xl ${value.bgColor} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                <value.icon className={`h-6 w-6 ${value.color}`} />
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AdBanner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <AdBanner slot="1992174832" format="auto" />
      </div>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-success/10 via-transparent to-blue-500/5 border border-success/20 p-10 sm:p-14 text-center">
          <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-xs font-bold text-success uppercase tracking-wider mb-6">
              Join the disciplined 10%
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold mb-4">
              Stop blowing accounts. Start building systems.
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-sm leading-relaxed">
              INTROSPECT™ gives you the behavioral mirror, risk framework, and accountability
              system to stay in the profitable 10% that SEBI data confirms almost no one reaches.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center bg-success hover:bg-success/90 text-success-foreground font-bold px-8 py-4 rounded-xl shadow-lg shadow-success/20 transition-all duration-300 group cursor-pointer"
              >
                View Pricing Plans
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/how-to-use"
                className="inline-flex items-center font-medium px-8 py-4 rounded-xl border border-border/50 hover:border-success/30 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
