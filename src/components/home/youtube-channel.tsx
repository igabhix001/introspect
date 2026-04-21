"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Youtube, Play, ExternalLink, BookOpen, TrendingUp, Users } from "lucide-react";

const channelFeatures = [
  { icon: TrendingUp, label: "Market Analysis", description: "Live intraday breakdowns" },
  { icon: BookOpen, label: "Discipline Tips", description: "Psychology & mindset content" },
  { icon: Users, label: "Trader Community", description: "Real strategies, real results" },
];

const CHANNEL_URL = "https://youtube.com/@intraday.mindview?si=lD3UgUoiLnZg2sw_";

export function YouTubeChannel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-red-500/[0.03] to-background pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Channel Info */}
            <div className="p-8 sm:p-12 flex flex-col justify-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold mb-6 w-fit"
              >
                <Youtube className="h-3.5 w-3.5" />
                YouTube Channel
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.15] mb-4"
              >
                Learn Trading Discipline
                <br />
                <span className="text-red-500">on YouTube</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-muted-foreground text-base leading-relaxed mb-8 max-w-md"
              >
                Free videos on intraday trading psychology, risk management, and building discipline habits that actually stick. No fluff — just what traders need.
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-3 mb-8"
              >
                {channelFeatures.map((feature, i) => (
                  <div key={feature.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">{feature.label}</span>
                      <span className="text-muted-foreground text-sm"> — {feature.description}</span>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Link
                  href={CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 group"
                >
                  <Youtube className="h-4.5 w-4.5" />
                  Subscribe to the Channel
                  <ExternalLink className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            </div>

            {/* Right: Visual Card */}
            <div className="relative flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-red-500/5 via-transparent to-transparent border-t lg:border-t-0 lg:border-l border-border/40">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full max-w-sm"
              >
                {/* Channel Card Mockup */}
                <div className="rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
                  {/* Channel Banner */}
                  <div className="h-24 bg-gradient-to-br from-red-600 via-red-500 to-rose-600 relative flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}
                    />
                    <Youtube className="h-10 w-10 text-white/90" />
                  </div>

                  {/* Channel Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        I
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">Intraday MindView</p>
                        <p className="text-xs text-muted-foreground">@intraday.mindview</p>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Subscribe
                        </span>
                      </div>
                    </div>

                    {/* Fake video thumbnails */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { title: "Why 90% of Traders Fail", views: "12K views", badge: "NEW" },
                        { title: "Stop-Loss Mastery Guide", views: "8.4K views", badge: null },
                        { title: "Discipline Score Explained", views: "6.1K views", badge: null },
                        { title: "Risk Rules for Intraday", views: "15K views", badge: "TOP" },
                      ].map((video, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={isInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                          className="group relative rounded-xl bg-muted/40 border border-border/50 overflow-hidden cursor-pointer hover:border-red-500/30 transition-colors"
                        >
                          <div className="aspect-video bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center relative">
                            <Play className="h-5 w-5 text-muted-foreground/60 group-hover:text-red-500 transition-colors" />
                            {video.badge && (
                              <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${video.badge === "NEW" ? "bg-success text-success-foreground" : "bg-amber-500 text-white"}`}>
                                {video.badge}
                              </span>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-[10px] font-medium text-foreground leading-tight line-clamp-2">{video.title}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{video.views}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
