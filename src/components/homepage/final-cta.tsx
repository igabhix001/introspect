import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCtaSection() {
  return (
    <section className="py-24 bg-[#0A0B0D] dark:bg-black text-white relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: `radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)`,
             backgroundSize: '24px 24px'
           }} 
      />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-success/[0.04] rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          The Market Exposes Every Emotional Weakness. <br />
          <span className="text-[#00c853]">INTROSPECT™ Helps You See Them First.</span>
        </h2>
        <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Get started today. Log your trades, follow your rules, and protect your hard-earned trading capital with pure behavioral discipline.
        </p>

        <div className="flex flex-col items-center gap-6 pt-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center bg-[#00c853] hover:bg-[#00c853]/90 text-black font-extrabold text-base px-10 py-5 rounded-xl transition-all duration-300 shadow-xl shadow-[#00c853]/15 hover:scale-102 cursor-pointer"
          >
            Start Your Free Assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-[#00c853] font-semibold">
              Join community of disciplined traders
            </p>
            <p className="text-xs text-white/50 font-mono uppercase tracking-widest">
              High value and affordable solution for traders
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
