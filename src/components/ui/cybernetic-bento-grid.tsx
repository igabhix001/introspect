"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

// Reusable BentoItem component
const BentoItem = ({ className, children }: { className?: string, children: React.ReactNode }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const item = itemRef.current;
        if (!item) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            item.style.setProperty('--mouse-x', `${x}px`);
            item.style.setProperty('--mouse-y', `${y}px`);
        };

        item.addEventListener('mousemove', handleMouseMove);

        return () => {
            item.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div 
          ref={itemRef} 
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-black/40 p-6 backdrop-blur-md transition-colors hover:border-border/80 dark:hover:border-white/20 hover:bg-muted/50 dark:hover:bg-black/60",
            className
          )}
        >
            <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0" 
                 style={{
                   background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(34, 197, 94, 0.15), transparent 40%)`,
                   opacity: 1 // Keep gradient always active when hovered
                 }}
            />
            <div className="relative z-10 h-full flex flex-col">
              {children}
            </div>
        </div>
    );
};

// Main Component
export const CyberneticBentoGrid = () => {
    return (
        <div className="w-full bg-background dark:bg-black py-24 relative overflow-hidden" id="features">
            {/* Background grids */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:opacity-100 opacity-30"></div>
            
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="inline-block text-sm font-semibold tracking-widest uppercase text-success mb-4">
                        INTROSPECT™ FEATURES
                    </span>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
                        <span className="gradient-text">100% Self-Aware</span> Trading
                    </h2>
                    <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
                        We don&apos;t just track the market. We help you track you. Hidden patterns like revenge trading, FOMO, and hesitation—identified before they cost you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
                    {/* large block */}
                    <BentoItem className="lg:col-span-2 lg:row-span-2 group">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
                                Market Sentiment Intelligence
                            </h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                It connects to live market data and tracks what&apos;s really happening — fear, confidence, momentum, and market breadth.
                            </p>
                            <p className="text-muted-foreground text-base mt-4 leading-relaxed">
                                The engine quietly processes all of it and gives you just one clear signal: what the market mood is right now.
                            </p>
                            <p className="text-muted-foreground/70 text-base mt-4 leading-relaxed">
                                No clutter. No confusion. Just a simple read on sentiment.
                            </p>
                            <div className="mt-8 flex gap-4 text-sm font-bold tracking-wider uppercase">
                                <span className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">🟢 Bullish</span>
                                <span className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">🔴 Bearish</span>
                                <span className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border">⚪ No Trade</span>
                            </div>
                        </div>
                    </BentoItem>

                    <BentoItem>
                        <h3 className="text-xl font-bold text-foreground mb-2">Position Sizing Framework</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Clear guidelines based on your risk per trade. Enter with confidence, knowing exactly what&apos;s at stake.
                        </p>
                    </BentoItem>

                    <BentoItem>
                        <h3 className="text-xl font-bold text-foreground mb-2">Risk per Trade</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Set your fixed risk (₹250, ₹500, ₹1000). The framework helps you stick to it. No more guessing.
                        </p>
                    </BentoItem>

                    <BentoItem className="lg:row-span-2 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Behavior Analytics</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                Self-assessment framework to identify emotional patterns in your trading journal.
                            </p>
                            <p className="text-success text-sm font-medium">Catch revenge trading, FOMO, and hesitation before they become habits.</p>
                        </div>
                    </BentoItem>

                    <BentoItem className="lg:col-span-2">
                        <h3 className="text-xl font-bold text-foreground mb-2">Accountability Challenge</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                            Join the 30-day challenge. Trade alongside professionals who&apos;ve been where you are. Build habits that last.
                        </p>
                    </BentoItem>
                </div>
            </div>
        </div>
    );
};
