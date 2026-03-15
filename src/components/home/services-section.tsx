"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  GraduationCap,
  UserCheck,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import DatabaseWithRestApi from "@/components/ui/database-with-rest-api";

const services = [
  {
    icon: BarChart3,
    title: "Demat Account Opening",
    description:
      "Open a FREE Fyers demat account — India's advanced trading platform with free API access for algorithmic trading and real-time market data.",
    tags: ["Fyers", "Free API", "Discount Broker"],
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Bot,
    title: "Automation Guidance",
    description:
      "Get expert guidance on building trading bots, automation workflows, and web-based trading applications tailored to Indian markets.",
    tags: ["Trading Bots", "Automation", "Web Apps"],
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: GraduationCap,
    title: "Risk Training Courses",
    description:
      "Enroll in the Intraday Mind Mastery program — a comprehensive course designed to transform your approach to risk management and discipline.",
    tags: ["Intraday Mind Mastery", "Risk Management"],
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
  {
    icon: UserCheck,
    title: "1-on-1 Counselling",
    description:
      "Book a private, confidential counselling session to work through trading psychology challenges with a certified trading mentor.",
    tags: ["Confidential", "Personal Mentoring"],
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

export function ServicesSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-success/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Our Services
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Beyond the{" "}
            <span className="bg-gradient-to-r from-success to-emerald-400 bg-clip-text text-transparent">
              Platform
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            From account setup to advanced automation — we support every aspect of your trading journey.
          </p>
        </motion.div>

        {/* Content: Services + Animated Component */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Services grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`group rounded-2xl border ${service.border} bg-card/50 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-black/5 transition-all duration-300`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${service.bg} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`h-5 w-5 ${service.color}`} />
                  </div>
                  <h3 className="font-heading text-sm font-bold mb-1.5">
                    {service.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${service.bg} ${service.color}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: DatabaseWithRestApi animated component */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <DatabaseWithRestApi
              circleText="API"
              title="Seamless integrations via Fyers API"
              badgeTexts={{
                first: "Demat",
                second: "Bots",
                third: "Risk",
                fourth: "Mentor",
              }}
              buttonTexts={{
                first: "Fyers API",
                second: "Live Data",
              }}
              lightColor="#22c55e"
            />

            {/* CTA card below the animation */}
            <div className="w-full max-w-[500px] mt-4 rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 text-center">
              <Mail className="h-6 w-6 text-success mx-auto mb-3" />
              <h3 className="font-heading text-base font-bold mb-1">
                Ready to level up?
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                For any of these services, reach out to us directly.
              </p>
              <a
                href="mailto:intradaymindview@gmail.com"
                className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold text-sm px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_30px_rgba(34,197,94,0.25)] transition-all duration-200 group"
              >
                <Mail className="h-4 w-4" />
                intradaymindview@gmail.com
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
