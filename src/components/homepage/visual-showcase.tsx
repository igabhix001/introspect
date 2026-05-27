"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function VisualShowcaseSection() {
  return (
    <section className="py-24 bg-[#0A0B0D] dark:bg-black text-white relative overflow-hidden">
      {/* Fintech grid background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none" 
           style={{ 
             backgroundImage: `radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)`,
             backgroundSize: '24px 24px'
           }} 
      />
      
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00D1FF]/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00c853]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-16">
          <span className="text-[11px] font-bold text-[#00D1FF] tracking-widest uppercase">
            Operational Showcase
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            A Psychological Mirror for Intraday Traders
          </h2>
          <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto">
            Seamlessly monitor execution quality, rule compliance, and risk parameters on a clean dark interface.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Continuous Webm Video Showcase */}
          <div className="lg:col-span-6 flex flex-col justify-center items-center">
            <div className="relative w-full max-w-[500px] aspect-square rounded-2xl border border-white/10 bg-black/60 shadow-2xl p-2 select-none overflow-hidden group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#00D1FF]/20 to-[#00c853]/20 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative h-full w-full rounded-xl overflow-hidden bg-zinc-950">
                <video
                  src="/Manage money.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-white/40 uppercase mt-4 tracking-widest">
              LIVE DEMO • 24/7 DOCK CONTROL
            </span>
          </div>

          {/* Right: Metrics / Heatmap Detail */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md">
              
              {/* Heatmap preview mockup */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-white tracking-wider">Discipline Heatmap</h4>
                  <div className="flex gap-3 text-[9px] text-white/50">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full"></span> Zen</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-destructive rounded-full"></span> Emotional</span>
                  </div>
                </div>
                
                {/* Small grid representing days */}
                <div className="flex flex-wrap gap-1.5 opacity-90">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const colors = ["bg-success", "bg-success", "bg-success", "bg-destructive", "bg-success", "bg-white/10"];
                    const bg = colors[i % colors.length];
                    return (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-[3px] ${bg} transition-all duration-300 hover:scale-110`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-white/40 font-mono mt-3 uppercase tracking-wider">
                  <span>Last 30 Days</span>
                  <span>Execution Consistency: 92%</span>
                </div>
              </div>

              {/* Substats */}
              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                  <p className="text-[9px] text-white/40 mb-1 uppercase">Win Rate</p>
                  <p className="text-sm sm:text-base font-bold text-white">64%</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                  <p className="text-[9px] text-white/40 mb-1 uppercase">Revenge Trades</p>
                  <p className="text-sm sm:text-base font-bold text-destructive">0</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                  <p className="text-[9px] text-white/40 mb-1 uppercase">Active Streak</p>
                  <p className="text-sm sm:text-base font-bold text-[#00D1FF]">14 Days</p>
                </div>
              </div>

              {/* Market breadth & threshold */}
              <div className="border-t border-white/5 pt-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-white/60"><span className="font-medium">Nifty Sentiment Breadth</span><span className="text-[#00D1FF]">78% Bullish</span></div>
                  <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-gradient-to-r from-success to-[#00D1FF] w-[78%]"></div></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Risk Threshold Warning</span>
                  <span className="font-semibold text-amber-400">₹12,500 Max Daily Risk</span>
                </div>
              </div>

              <Link
                href="/auth/signup"
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#00D1FF] hover:bg-[#00D1FF]/90 text-black font-extrabold rounded-xl text-sm transition-all duration-300 select-none shadow-lg shadow-[#00D1FF]/10 active:scale-98"
              >
                Start Building Consistency
                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
