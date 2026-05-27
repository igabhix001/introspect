export default function TrustBarSection() {
  return (
    <section className="py-10 border-y border-border bg-muted/30 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 text-[11px] font-bold tracking-widest text-muted-foreground uppercase opacity-85">
          <span>Built for Intraday Traders</span>
          <span className="hidden sm:inline">•</span>
          <span>Discipline-First Framework</span>
          <span className="hidden sm:inline">•</span>
          <span>Behavioural Risk Analytics</span>
          <span className="hidden md:inline">•</span>
          <span>Capital Protection Focus</span>
          <span className="hidden md:inline">•</span>
          <span>AI-Powered Trading Psychology</span>
        </div>
      </div>
    </section>
  );
}
