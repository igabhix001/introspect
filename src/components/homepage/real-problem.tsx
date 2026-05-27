import Image from "next/image";
import { AlertTriangle, Frown } from "lucide-react";

export default function RealProblemSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Text */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive uppercase tracking-widest">
              <AlertTriangle className="h-4 w-4" /> The Hard Truth
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Most Traders Don’t Lose <br />
              <span className="text-destructive">Because of Strategy.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Strategy is only 20% of the game. The other 80% is the discipline to execute that strategy consistently without emotional interference.
            </p>
            
            <div className="space-y-4 pt-4 border-t border-border">
              {[
                {
                  title: "Emotional execution",
                  desc: "Letting fear of missing out (FOMO) or fear of losing dictate your entry and exit points."
                },
                {
                  title: "Inconsistent position sizing",
                  desc: "Betting big when you feel lucky and small when you are scared, destroying your probability math."
                },
                {
                  title: "Overtrading & Revenge trading",
                  desc: "Trying to make back losses immediately or trading excessively just to chase the market rush."
                },
                {
                  title: "Poor risk discipline",
                  desc: "Moving stop losses further away or averaging down on losing positions hoping for a bounce."
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="p-1 rounded bg-destructive/10 text-destructive mt-0.5">
                    <Frown className="h-4 w-4 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-success/5 border-l-4 border-success">
              <p className="text-sm font-semibold italic text-foreground leading-relaxed">
                &ldquo;INTROSPECT™ helps you identify and fix these exact behavioural leaks before they blow up your account.&rdquo;
              </p>
            </div>
          </div>

          {/* Right Column: Illustration */}
          <div className="relative flex justify-center items-center p-8 bg-muted/10 rounded-3xl border border-border">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent rounded-3xl pointer-events-none" />
            <div className="relative w-full max-w-[450px] aspect-square transition-transform duration-500 hover:scale-102">
              <Image
                src="/Financial data-bro.svg"
                alt="Behavioural Leaks Analysis"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
