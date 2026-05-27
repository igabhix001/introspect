import Image from "next/image";

export default function SocialProofSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-success uppercase tracking-widest">
            Success Stories
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Discipline is the Ultimate Edge
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Our traders don&apos;t just brag about random massive profit days; they brag about executing their rules perfectly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {[
            {
              text: "Reduced my overtrading behaviour by 70% in the first 14 days of using the risk engine feedback.",
              author: "Rahul M.",
              style: "Options Scalper"
            },
            {
              text: "The ATR position size calculator is a massive game-changer. I don't calculate sizes manually anymore.",
              author: "Anita S.",
              style: "Intraday Equity"
            },
            {
              text: "Finally stopped revenge averaging on bad trades after seeing the AI report quantify how much it cost me.",
              author: "David K.",
              style: "Futures Trader"
            }
          ].map((card, idx) => (
            <div key={idx} className="bg-card border border-border p-6 rounded-2xl space-y-4 relative flex flex-col justify-between hover:border-success/20 transition-all duration-300">
              <p className="text-sm italic text-muted-foreground leading-relaxed">
                &ldquo;{card.text}&rdquo;
              </p>
              <div>
                <h5 className="font-bold text-sm text-foreground">{card.author}</h5>
                <p className="text-[11px] text-success font-medium uppercase tracking-wider">{card.style}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Core Illustration below cards */}
        <div className="flex justify-center items-center pt-4">
          <div className="relative w-full max-w-[320px] aspect-square">
            <Image
              src="/Revenue-bro.svg"
              alt="Consistently Growing Trading Revenue"
              fill
              className="object-contain"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
