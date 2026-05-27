import { Activity, Target, TrendingUp, Trophy, BookOpen, Smile } from "lucide-react";

export default function CoreSystemsSection() {
  return (
    <section className="py-24 bg-muted/20 border-y border-border relative overflow-hidden" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-success uppercase tracking-widest">
            Proprietary Infrastructure
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Five Systems. One Goal: Consistency.
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            We provide the full guardrail ecosystem you need to execute your trades systematically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System 1 */}
          <div className="bg-card border border-border/80 p-8 rounded-2xl transition-all duration-300 hover:border-success/30 hover:shadow-lg hover:shadow-success/[0.02]">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center text-success mb-5">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-bold mb-2">Behavioural Risk Engine</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The heart of Introspect. It analyzes your trade frequency, holding duration, and drawdown to calculate your real-time risk profile score.
            </p>
          </div>

          {/* System 2 */}
          <div className="bg-card border border-border/80 p-8 rounded-2xl transition-all duration-300 hover:border-success/30 hover:shadow-lg hover:shadow-success/[0.02]">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center text-success mb-5">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-bold mb-2">Position Size &amp; ATR Calculator</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Auto-calculate dynamic, volatile-adjusted position sizes based on current market Average True Range (ATR) to size your positions correctly.
            </p>
          </div>

          {/* System 3 */}
          <div className="bg-card border border-border/80 p-8 rounded-2xl transition-all duration-300 hover:border-success/30 hover:shadow-lg hover:shadow-success/[0.02]">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center text-success mb-5">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-bold mb-2">Market Sentiment Engine</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Focus on NIFTY index breadth and trend alignment. Know in real-time when you are trading against heavy institutional order flow.
            </p>
          </div>

          {/* System 4 */}
          <div className="bg-card border border-border/80 p-8 rounded-2xl transition-all duration-300 hover:border-success/30 hover:shadow-lg hover:shadow-success/[0.02]">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center text-success mb-5">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-bold mb-2">Discipline Challenges</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gamify your execution consistency. Earn loyalty points for following your rules, maintain streaks, and unlock elite trader milestones.
            </p>
          </div>

          {/* System 5 - Wider Card */}
          <div className="bg-card border border-border/80 p-8 rounded-2xl transition-all duration-300 hover:border-success/30 hover:shadow-lg hover:shadow-success/[0.02] md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center text-success">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-bold">Trading Journal &amp; Mistake Tracker</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The fastest way to log. Tag emotional mistakes with a single click and see exactly which psychological leak is costing you the most money over a 30-day period.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col gap-2.5">
                <div className="flex justify-between items-center bg-card p-3 rounded-lg text-xs border border-border">
                  <span className="font-semibold text-muted-foreground">Tag: <strong className="text-foreground">FOMO Entry</strong></span>
                  <span className="text-destructive font-mono font-bold">-₹2,500</span>
                </div>
                <div className="flex justify-between items-center bg-card p-3 rounded-lg text-xs border border-border">
                  <span className="font-semibold text-muted-foreground">Tag: <strong className="text-foreground">Revenge Averaging</strong></span>
                  <span className="text-destructive font-mono font-bold">-₹4,800</span>
                </div>
                <div className="flex justify-between items-center bg-success/5 p-3 rounded-lg text-xs border border-success/20">
                  <span className="text-success font-semibold flex items-center gap-1"><Smile className="h-3.5 w-3.5" /> Rule Followed Bonus</span>
                  <span className="text-success font-mono font-bold">+50 pts</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
