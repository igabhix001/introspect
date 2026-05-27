import { Frown, Smile, Check } from "lucide-react";

export default function BeforeAfterSection() {
  return (
    <section className="py-24 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Transform Your Execution
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            The difference between trading on random intuition and trading with structure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Before */}
          <div className="bg-destructive/5 border border-destructive/10 p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-2.5 text-destructive">
              <Frown className="h-6 w-6" />
              <h4 className="font-bold text-lg uppercase tracking-wider">Before Introspect</h4>
            </div>
            <ul className="space-y-3.5 text-sm text-muted-foreground">
              <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Random position sizing based on gut feelings</li>
              <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Entering trades because of FOMO or boredom</li>
              <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> No clear log or tracking of emotional mistakes</li>
              <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Trading against major index trend without knowing</li>
            </ul>
          </div>

          {/* After */}
          <div className="bg-success/5 border border-success/20 p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 py-1.5 px-3 bg-success text-success-foreground text-[9px] font-bold tracking-widest rounded-bl-lg uppercase">
              Structured
            </div>
            <div className="flex items-center gap-2.5 text-success">
              <Smile className="h-6 w-6" />
              <h4 className="font-bold text-lg uppercase tracking-wider">With Introspect</h4>
            </div>
            <ul className="space-y-3.5 text-sm text-foreground">
              <li className="flex gap-2 items-start"><Check className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" /> <strong>ATR-based risk management</strong> calculated for every single trade</li>
              <li className="flex gap-2 items-start"><Check className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" /> <strong>Rule-based entries</strong> with behavioral checklist verification</li>
              <li className="flex gap-2 items-start"><Check className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" /> <strong>Data-driven awareness</strong> of emotional and psychological leaks</li>
              <li className="flex gap-2 items-start"><Check className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" /> <strong>High-probability alignment</strong> with real-time market sentiment</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
