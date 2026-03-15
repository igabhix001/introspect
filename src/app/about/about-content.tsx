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
      {/* Hero */}
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
              About Us
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              We&apos;re Fixing the{" "}
              <span className="gradient-text">Missing Piece</span>{" "}
              in Trading
            </h1>
            <p className="text-xl sm:text-2xl font-medium text-muted-foreground leading-relaxed">
              Intraday MindView Learning was born from a simple observation:
              most traders don&apos;t fail because of bad strategies — they fail
              because they can&apos;t follow their own rules. INTROSPECT™ was
              built to change that.
            </p>
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
            <div className="relative w-48 h-48 sm:w-64 sm:h-64">
              <div className="absolute inset-0 bg-success/10 rounded-full blur-[60px] pointer-events-none" />
              <Image
                src="/logo.png"
                alt="INTROSPECT™ Logo"
                fill
                className="object-contain relative z-10"
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
              To empower intraday traders with the tools and discipline framework
              they need to protect their capital, build consistency, and transform
              their trading journey — one disciplined day at a time.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We started with the Indian market (Nifty, BankNifty) and are expanding
              globally (S&P 500, FTSE, and more). Our vision: every intraday trader,
              everywhere, has access to a personal risk guardian.
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
              className="p-6 sm:p-8 rounded-2xl bg-card/50 border border-border/50 glass-card hover:border-success/30 transition-all duration-300 group cursor-pointer"
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4">
            Ready to transform your trading?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join INTROSPECT™ and start building the discipline that separates
            consistent traders from the 90%.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center bg-success hover:bg-success/90 text-success-foreground font-bold px-8 py-4 rounded-xl shadow-lg shadow-success/20 transition-all duration-300 group cursor-pointer"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
