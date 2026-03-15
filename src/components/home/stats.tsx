"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingDown, Calendar, BarChart3, Users } from "lucide-react";

const stats = [
  {
    value: "90",
    suffix: "%",
    label: "Traders Lose Money",
    description: "Lack of discipline is the #1 cause",
    icon: TrendingDown,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    value: "30",
    suffix: " Days",
    label: "To Build a Habit",
    description: "Our challenge system builds consistency",
    icon: Calendar,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    value: "5",
    suffix: "",
    label: "Risk Categories",
    description: "Comprehensive behavioral analysis",
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    value: "100",
    suffix: "+",
    label: "Personalized Rules",
    description: "Tailored to your trading style",
    icon: Users,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
];

function AnimatedCounter({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <span ref={ref} className="tabular-nums">
      {isInView && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CountUp target={parseInt(value)} duration={2} />
          {suffix}
        </motion.span>
      )}
    </span>
  );
}

function CountUp({ target, duration }: { target: number; duration: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
    >
      {isInView ? <CountUpAnimation target={target} duration={duration} /> : "0"}
    </motion.span>
  );
}

function CountUpAnimation({ target, duration }: { target: number; duration: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  return (
    <motion.span
      ref={nodeRef}
      initial="hidden"
      animate="visible"
    >
      <CountUpDisplay target={target} duration={duration} />
    </motion.span>
  );
}

function CountUpDisplay({ target, duration }: { target: number; duration: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  if (typeof window !== "undefined" && isInView && ref.current) {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      if (ref.current) {
        ref.current.textContent = current.toString();
      }
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  return <span ref={ref}>0</span>;
}

export function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />

      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="relative p-6 sm:p-8 rounded-2xl bg-card/50 border border-border/50 glass-card hover:border-success/30 transition-all duration-300 h-full">
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className={`inline-flex p-2.5 rounded-xl ${stat.bgColor} mb-4`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>

                <div className={`text-3xl sm:text-4xl font-heading font-extrabold ${stat.color} mb-1`}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>

                <h3 className="font-heading font-semibold text-sm sm:text-base mb-1">
                  {stat.label}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
