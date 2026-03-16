"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categories = [
  "All",
  "Discipline Mondays",
  "Risk-First Fridays",
  "Trading Psychology",
  "Weekly Newsletter",
];

const blogPosts = [
  // LinkedIn Posts
  {
    title: "Risk-Reward Ratio - The Silent Edge in Intraday Trading",
    excerpt: "Understanding risk-reward is the foundation of profitable trading. Learn why this ratio matters more than win rate.",
    category: "Trading Psychology",
    date: "Mar 15, 2026",
    readTime: "5 min read",
    featured: true,
    slug: "risk-reward-ratio",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_tradingpsychology-riskmanagement-disciplinefirst-activity-7437391886006493185-z_Gu",
  },
  {
    title: "The Sachin Tendulkar Analogy – Applied to Trading",
    excerpt: "What cricket's greatest batsman can teach us about patience, discipline, and playing the long game in trading.",
    category: "Trading Psychology",
    date: "Mar 14, 2026",
    readTime: "4 min read",
    featured: false,
    slug: "sachin-tendulkar-trading",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_the-sachin-tendulkar-analogy-applied-to-activity-7438422659148947456-8Y34",
  },
  {
    title: "Revenge Trading Hurts Intraday Traders",
    excerpt: "After a loss, the urge to immediately make it back is powerful. Here's why revenge trading destroys accounts.",
    category: "Trading Psychology",
    date: "Mar 12, 2026",
    readTime: "5 min read",
    featured: false,
    slug: "revenge-trading-hurts",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_intradaytrading-tradingpsychology-disciplinefirst-activity-7437010339348611073-6DE2",
  },
  {
    title: "INTROSPECT: The Mirror Most Traders Refuse to Look Into",
    excerpt: "Self-awareness is the first step to trading discipline. Are you ready to face your trading patterns?",
    category: "Trading Psychology",
    date: "Mar 10, 2026",
    readTime: "6 min read",
    featured: false,
    slug: "introspect-mirror",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_tradingpsychology-discipline-riskmanagement-activity-7436375744953507842-wQAP",
  },
  {
    title: "The Psychology Mirror: Trader vs. Investor",
    excerpt: "Understanding the fundamental mindset differences between traders and investors - and why it matters.",
    category: "Trading Psychology",
    date: "Mar 8, 2026",
    readTime: "5 min read",
    featured: false,
    slug: "trader-vs-investor",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_tradingpsychology-investing-mindset-activity-7435943884721037313--PP_",
  },
  // Discipline Mondays
  {
    title: "Most traders lose money not because they're wrong — but because they can't sit still",
    excerpt: "The hardest skill in trading isn't finding entries. It's doing nothing when there's nothing to do.",
    category: "Discipline Mondays",
    date: "Mar 11, 2026",
    readTime: "4 min read",
    featured: false,
    slug: "sit-still-discipline",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_disciplinemondays-tradingpsychology-riskfirst-activity-7434057413009448960-QhYb",
  },
  {
    title: "You're posting about stop losses again? No profits today?",
    excerpt: "Why focusing on stop losses is more important than chasing profits. The real edge is in risk management.",
    category: "Discipline Mondays",
    date: "Mar 9, 2026",
    readTime: "4 min read",
    featured: false,
    slug: "stop-losses-focus",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_marketlearningdisciplinemondays-tradingpsychology-activity-7436650526739529728-5FE6",
  },
  {
    title: "Your Costliest Trade Isn't the Stop Loss",
    excerpt: "The trades that hurt most aren't the ones you stopped out of. It's the ones you held hoping for a miracle.",
    category: "Discipline Mondays",
    date: "Mar 7, 2026",
    readTime: "5 min read",
    featured: false,
    slug: "costliest-trade",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_disciplinemonday-tradingpsychology-riskmanagement-activity-7436610719346761728-O-yS",
  },
  {
    title: "Trading isn't about clicking buttons",
    excerpt: "Real trading is about preparation, patience, and process. The button click is just the final step.",
    category: "Discipline Mondays",
    date: "Mar 5, 2026",
    readTime: "4 min read",
    featured: false,
    slug: "not-clicking-buttons",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_disciplinemonday-riskfirst-intradaytrading-activity-7439147434854981632-RI6X",
  },
  // Risk First Fridays
  {
    title: "The ₹1,999 Psychology Gap",
    excerpt: "Why traders treat ₹1,999 differently than ₹2,000 and how this psychological quirk affects your risk management.",
    category: "Risk-First Fridays",
    date: "Mar 13, 2026",
    readTime: "5 min read",
    featured: false,
    slug: "psychology-gap",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_tradingpsychology-riskmanagement-nifty50-activity-7438060512296321024-UvDr",
  },
  {
    title: "The 1% Rule – Your Account's Best Friend",
    excerpt: "Never risk more than 1% of your capital on a single trade. Here's why this simple rule saves accounts.",
    category: "Risk-First Fridays",
    date: "Mar 6, 2026",
    readTime: "5 min read",
    featured: false,
    slug: "one-percent-rule",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_riskfirstfriday-tradingpsychology-riskmanagement-activity-7435521543419392000-5bpk",
  },
  // Newsletter
  {
    title: "Introspect Risk Guardian Newsletter",
    excerpt: "Weekly insights on trading psychology, risk management, and building discipline. Subscribe to stay ahead.",
    category: "Weekly Newsletter",
    date: "Mar 4, 2026",
    readTime: "Newsletter",
    featured: false,
    slug: "newsletter-risk-guardian",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_introspect-tradingpsychology-riskmanagement-activity-7434831206313185280-7v_5",
  },
  {
    title: "Why 'Perfect' Algorithms Fail in Imperfect Markets",
    excerpt: "Automation isn't a profit machine. Understanding why even the best algos need human oversight.",
    category: "Weekly Newsletter",
    date: "Mar 2, 2026",
    readTime: "Newsletter",
    featured: false,
    slug: "algorithms-fail",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_activity-7436688921557712896-49gR",
  },
  {
    title: "The Mental Battle of Day Trading: It's You vs. You",
    excerpt: "Your biggest opponent in trading isn't the market. It's the voice in your head telling you to break your rules.",
    category: "Weekly Newsletter",
    date: "Feb 28, 2026",
    readTime: "Newsletter",
    featured: false,
    slug: "mental-battle",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_new-newsletter-alert-ever-felt-like-the-activity-7437697883065245696-AuTB",
  },
  {
    title: "When Greed Disguised Itself as Logic",
    excerpt: "Ever had a day where you knew better... but did it anyway? A story about greed wearing the mask of reason.",
    category: "Weekly Newsletter",
    date: "Feb 25, 2026",
    readTime: "Newsletter",
    featured: false,
    slug: "greed-as-logic",
    externalUrl: "https://www.linkedin.com/posts/venkat-iyer-7839883b2_ever-had-a-day-where-you-knew-betterbut-activity-7438782530394251264-mSDK",
  },
];

export function BlogContent() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = activeCategory === "All"
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

  const featuredPost = filteredPosts.find((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured);

  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
            Blog
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Trading <span className="gradient-text">Wisdom</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Discipline Mondays. Risk-First Fridays. Articles, guides, and
            insights to help you trade with discipline.
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? "bg-success text-success-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Featured Post */}
            {featuredPost && (
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative rounded-2xl bg-card/50 border border-border/50 glass-card p-8 sm:p-10 mb-10 group cursor-pointer hover:border-success/30 transition-all duration-300"
              >
                <Badge className="bg-success/10 text-success border-success/20 mb-4">
                  Featured
                </Badge>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3 group-hover:text-success transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mb-4 max-w-2xl">
                  {featuredPost.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    {featuredPost.category}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {featuredPost.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <a
                  href={(featuredPost as typeof blogPosts[0]).externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-success font-semibold mt-4 hover:underline"
                >
                  Read on LinkedIn <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </motion.article>
            )}

            {/* Post Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post, i) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                  className="p-6 rounded-2xl bg-card/50 border border-border/50 glass-card group cursor-pointer hover:border-success/30 transition-all duration-300 flex flex-col"
                >
                  <Badge
                    variant="outline"
                    className="text-xs mb-4 border-border/50"
                  >
                    {post.category}
                  </Badge>
                  <h3 className="font-heading text-lg font-bold mb-2 group-hover:text-success transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <a
                    href={(post as typeof blogPosts[0]).externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-success font-semibold mt-auto pt-4 hover:underline"
                  >
                    Read on LinkedIn <ArrowRight className="h-3 w-3" />
                  </a>
                </motion.article>
              ))}
            </div>

            {regularPosts.length === 0 && !featuredPost && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">No articles in this category yet.</p>
                <p className="text-sm mt-1">Check back soon!</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
