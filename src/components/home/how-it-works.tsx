"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { UserPlus, ClipboardCheck, Cog, Flame } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up",
    description: "Create your account in seconds. No credit card required to explore.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    icon: ClipboardCheck,
    step: "02",
    title: "Take the Assessment",
    description: "Answer 10-15 questions about your trading behavior, emotions, and habits.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    icon: Cog,
    step: "03",
    title: "Get Personalized Rules",
    description: "Receive your risk profile, discipline score, and custom rules tailored to your weaknesses.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    icon: Flame,
    step: "04",
    title: "Build Discipline Daily",
    description: "Use the trade journal, position calculator, and daily challenges to build unbreakable habits.",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30 pointer-events-none" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
            Simple Process
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            How INTROSPECT™{" "}
            <span className="gradient-text">Works</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-base sm:text-lg">
            From assessment to habit formation in four simple steps.
            Your journey to disciplined trading starts here.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Connecting line (desktop) */}
          <div className="absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-border to-transparent hidden lg:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative group"
            >
              <div className="text-center">
                {/* Step Circle */}
                <div className="relative inline-flex mb-6">
                  <div
                    className={`w-16 h-16 rounded-2xl ${step.bgColor} border ${step.borderColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    <step.icon className={`h-7 w-7 ${step.color}`} />
                  </div>
                  {/* Step Number */}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border border-border text-xs font-bold flex items-center justify-center font-heading">
                    {step.step}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-bold mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
