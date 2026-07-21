import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Linkedin, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Shield,
  HelpCircle
} from "lucide-react";
import { blogPosts } from "../posts";
import { AdBanner } from "@/components/ads/google-adsense";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) {
    return {
      title: "Article Not Found | INTROSPECT™ Blog",
    };
  }
  return {
    title: `${post.title} | INTROSPECT™ Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // Generate JSON-LD schemas
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": new Date(post.date).toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author.name,
      "jobTitle": post.author.role,
      "sameAs": post.author.linkedin
    },
    "publisher": {
      "@type": "Organization",
      "name": "INTROSPECT™",
      "logo": {
        "@type": "ImageObject",
        "url": "https://introspect.app/logo.png"
      }
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <article className="min-h-screen pt-32 pb-20 overflow-hidden relative bg-background">
      {/* Background blur effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-success/[0.03] rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Dynamic JSON-LD injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb & Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border/40 pb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-success transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Blog
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-success transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-success transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
          </div>
        </div>

        {/* Category & Title */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20 mb-4 uppercase tracking-wider">
            {post.category}
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            {post.title}
          </h1>
        </div>

        {/* Author Bylines & Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card/40 border border-border/40 p-4 rounded-2xl backdrop-blur-sm mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center font-heading font-extrabold text-success border border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              VN
            </div>
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {post.author.name}
                <a
                  href={post.author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-[#0077b5] transition-colors"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin className="h-3.5 w-3.5 fill-current" />
                </a>
              </p>
              <p className="text-xs text-muted-foreground">{post.author.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground sm:border-l sm:border-border/40 sm:pl-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
          </div>
        </div>

        {/* TL;DR Callout Block */}
        <div className="bg-success/5 border-l-4 border-success p-6 rounded-r-2xl mb-10 shadow-[0_4px_20px_rgba(34,197,94,0.02)]">
          <h2 className="text-xs font-bold text-success uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            Quick Summary (TL;DR)
          </h2>
          <p className="text-sm sm:text-base text-foreground/90 font-medium leading-relaxed">
            {post.tldr}
          </p>
        </div>

        {/* Main Content Body */}
        <div className="prose prose-invert max-w-none text-foreground/80 space-y-8 text-sm sm:text-base leading-relaxed">
          
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-normal">
            {post.introduction}
          </p>

          {/* Section: What Is */}
          <section className="pt-4">
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground mb-4 border-b border-border/40 pb-2">
              {post.whatIs.heading}
            </h2>
            <p>{post.whatIs.text}</p>
          </section>

          {/* Section: Why It Matters */}
          <section className="pt-4">
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground mb-4 border-b border-border/40 pb-2">
              {post.whyItMatters.heading}
            </h2>
            <p>{post.whyItMatters.text}</p>
          </section>

          {/* Section: Quote Callout */}
          <div className="my-10 relative overflow-hidden rounded-2xl border border-border/40 bg-muted/20 p-8">
            <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
            <div className="relative z-10 text-center">
              <p className="text-base sm:text-lg font-heading italic text-foreground/90 mb-4 max-w-2xl mx-auto">
                &ldquo;{post.quote}&rdquo;
              </p>
              <p className="text-xs font-bold text-success tracking-widest uppercase">
                &mdash; {post.author.name}, {post.author.role}
              </p>
            </div>
          </div>

          {/* Section: How It Works */}
          <section className="pt-4">
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground mb-4 border-b border-border/40 pb-2">
              {post.howItWorks.heading}
            </h2>
            <p>{post.howItWorks.text}</p>
          </section>

          {/* Section: Practical Steps (Styled List) */}
          <section className="pt-4 bg-card/20 border border-border/40 rounded-2xl p-6">
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {post.practicalSteps.heading}
            </h2>
            <ul className="space-y-3">
              {post.practicalSteps.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-foreground/80">
                  <span className="font-bold text-success font-mono">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section: Common Mistakes (Styled List) */}
          <section className="pt-4 bg-red-950/5 border border-red-500/10 rounded-2xl p-6">
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500/80" />
              {post.commonMistakes.heading}
            </h2>
            <ul className="space-y-3">
              {post.commonMistakes.mistakes.map((mistake, idx) => (
                <li key={idx} className="flex gap-3 text-foreground/80">
                  <span className="text-red-500/80 font-bold">&bull;</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section: Conclusion */}
          <section className="pt-4 border-t border-border/40">
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground mb-4">
              {post.conclusion.heading}
            </h2>
            <p>{post.conclusion.text}</p>
          </section>

        </div>

        {/* E-E-A-T stats section & disclaimer */}
        <div className="mt-12 p-6 rounded-2xl bg-black/10 dark:bg-black/30 border border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md text-center md:text-left">
            <h3 className="text-sm font-bold text-foreground mb-1">Empirical Risk Warning</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Official regulatory studies from the Securities and Exchange Board of India (SEBI) highlight that more than 90% of individual traders lose capital in derivative trading, with average losses of ₹1.1 Lakh.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center bg-card/60 px-5 py-4 border border-border/40 rounded-xl min-w-[150px] shadow-sm">
            <span className="text-2xl font-black text-red-500/90 font-mono">90%+</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Traders Lose Money</span>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-16 border-t border-border/40 pt-10">
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-success" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {post.faqs.map((faq, idx) => (
              <div key={idx} className="bg-card/30 border border-border/40 p-5 rounded-2xl">
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-2 flex items-start gap-2">
                  <span className="text-xs font-bold font-mono text-success bg-success/10 px-2 py-0.5 rounded">Q{idx + 1}</span>
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-10 border-l border-border/40">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* LinkedIn Outbound CTA */}
        <div className="mt-16 bg-gradient-to-r from-success/5 to-blue-500/[0.02] border border-border/40 p-8 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
          <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground mb-2">
            Looking for daily updates on trading discipline?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
            Founder Venkat Narayanan shares insights, case studies, and actionable risk management techniques weekly on LinkedIn.
          </p>
          <a
            href={post.author.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0077b5] hover:bg-[#006297] text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-md shadow-[#0077b5]/20 cursor-pointer"
          >
            Connect on LinkedIn
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* AdSense Banner for Article Page */}
        <AdBanner slot="article-bottom-ad" format="auto" className="mt-8" />
      </div>
    </article>
  );
}
