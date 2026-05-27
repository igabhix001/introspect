import Image from "next/image";
import { Zap, Target, TrendingUp, Wallet } from "lucide-react";

export default function WhoItIsForSection() {
  return (
    <section className="py-24 bg-muted/20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Content */}
          <div className="space-y-8">
            <div>
              <span className="text-xs font-bold text-success uppercase tracking-widest">
                Target Audience
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-2">
                Built For Specialists
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2 leading-relaxed">
                No matter your niche, risk and discipline are the ultimate foundations of consistency. INTROSPECT™ supports all active styles.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Zap, name: "Intraday Traders" },
                { icon: Target, name: "Options Traders" },
                { icon: TrendingUp, name: "Futures Traders" },
                { icon: Wallet, name: "Funded Traders" }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-card border border-border p-5 rounded-2xl text-center flex flex-col items-center justify-center hover:scale-105 hover:border-success/30 transition-all duration-300"
                  >
                    <Icon className="h-8 w-8 text-success mb-3" />
                    <h5 className="font-bold text-sm text-foreground">{item.name}</h5>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="flex justify-center items-center">
            <div className="relative w-full max-w-[420px] aspect-square">
              <Image
                src="/Investing-bro.svg"
                alt="Investing and Trading Styles"
                fill
                className="object-contain"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
