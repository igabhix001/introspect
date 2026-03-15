"use client";

import { useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  Shield,
  Calculator,
  BookOpen,
  Activity,
  Flame,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Risk Assessment Engine",
    description:
      "Take a diagnostic assessment covering 5 behavioral categories. Get your personalized risk profile and understand what's holding you back.",
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "group-hover:border-blue-500/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    span: "lg:col-span-2",
  },
  {
    icon: Calculator,
    title: "Position Sizing Calculator",
    description:
      "Input your capital, entry, and stop-loss. Instantly see your max quantity, risk per trade, and suggested targets.",
    color: "from-success/20 to-success/5",
    borderColor: "group-hover:border-success/30",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    span: "lg:col-span-1",
  },
  {
    icon: BookOpen,
    title: "Trade Journal + Mistake Detector",
    description:
      "Log every trade with emotional context. The system detects revenge trading, overtrading, and rule violations automatically.",
    color: "from-purple-500/20 to-purple-600/5",
    borderColor: "group-hover:border-purple-500/30",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    span: "lg:col-span-1",
  },
  {
    icon: Activity,
    title: "Market Sentiment Intelligence",
    description:
      "Real-time market zone classification. Know if conditions favor buying, selling, or sitting out — powered by Nifty data and VIX analysis.",
    color: "from-teal-500/20 to-teal-600/5",
    borderColor: "group-hover:border-teal-500/30",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-400",
    span: "lg:col-span-1",
  },
  {
    icon: Flame,
    title: "Self-Challenges & Habit Building",
    description:
      "30, 60, and 90-day progressive challenges. Track your rule adherence daily and build unbreakable trading habits.",
    color: "from-amber-500/20 to-amber-600/5",
    borderColor: "group-hover:border-amber-500/30",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    span: "lg:col-span-1",
  },
  {
    icon: FileText,
    title: "End-of-Day Reports & Coaching",
    description:
      "Daily performance summaries with what you did right, what went wrong, and tomorrow's focus area. Like having a trading coach 24/7.",
    color: "from-rose-500/20 to-rose-600/5",
    borderColor: "group-hover:border-rose-500/30",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    span: "lg:col-span-2",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 25, stiffness: 150 });
  const springY = useSpring(mouseY, { damping: 25, stiffness: 150 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative ${feature.span}`}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight gradient that follows cursor */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
        style={{
          background: `radial-gradient(400px circle at ${springX}px ${springY}px, rgba(34, 197, 94, 0.06), transparent 40%)`,
        }}
      />

      <div
        className={`relative h-full p-6 sm:p-8 rounded-2xl border border-white/[0.06] ${feature.borderColor} bg-slate-900/30 backdrop-blur-sm transition-all duration-500 overflow-hidden cursor-pointer`}
      >
        {/* Gradient overlay on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
        />

        <div className="relative z-10">
          <div
            className={`inline-flex p-3 rounded-xl ${feature.iconBg} mb-5 transition-transform duration-300 group-hover:scale-110`}
          >
            <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
          </div>

          <h3 className="font-heading text-lg font-bold mb-3 group-hover:text-foreground transition-colors">
            {feature.title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-muted-foreground/90 transition-colors">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-success/[0.03] rounded-full blur-[150px]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
            The INTROSPECT™ System
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Trade Disciplined</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-base sm:text-lg">
            Six integrated tools designed to analyze, protect, and build the mental
            framework every intraday trader needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
