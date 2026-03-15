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
  {
    title: "Why 90% of Intraday Traders Lose Money (And How to Be the 10%)",
    excerpt:
      "The data is clear — most traders fail not because of bad strategy, but because of emotional decision-making. Here's how to break the cycle.",
    category: "Trading Psychology",
    date: "Mar 10, 2026",
    readTime: "8 min read",
    featured: true,
    slug: "why-90-percent-traders-lose",
  },
  {
    title: "The Stop-Loss Rule That Saved My Account",
    excerpt:
      "How implementing a non-negotiable stop-loss policy changed everything about my trading discipline.",
    category: "Discipline Mondays",
    date: "Mar 3, 2026",
    readTime: "5 min read",
    featured: false,
    slug: "stop-loss-rule-saved-account",
  },
  {
    title: "Understanding Position Sizing: The Calculator Every Trader Needs",
    excerpt:
      "Most traders risk too much per trade. Learn how proper position sizing protects your capital even during losing streaks.",
    category: "Risk-First Fridays",
    date: "Feb 28, 2026",
    readTime: "6 min read",
    featured: false,
    slug: "position-sizing-calculator",
  },
  {
    title: "Revenge Trading: How to Recognize It and Stop",
    excerpt:
      "After a loss, the urge to immediately make it back is powerful. Here are 5 strategies to break the revenge trading cycle.",
    category: "Trading Psychology",
    date: "Feb 24, 2026",
    readTime: "7 min read",
    featured: false,
    slug: "revenge-trading-how-to-stop",
  },
  {
    title: "The 30-Day Discipline Challenge: A Complete Guide",
    excerpt:
      "Transform your trading habits with our proven 30-day challenge framework. Day-by-day breakdown included.",
    category: "Discipline Mondays",
    date: "Feb 17, 2026",
    readTime: "10 min read",
    featured: false,
    slug: "30-day-discipline-challenge",
  },
  {
    title: "India VIX and Trading: What Every Nifty Trader Must Know",
    excerpt:
      "VIX above 20? Here's why you should reduce your position size by 50% and how INTROSPECT™ automates this for you.",
    category: "Weekly Newsletter",
    date: "Feb 14, 2026",
    readTime: "6 min read",
    featured: false,
    slug: "india-vix-nifty-trading",
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
                {featuredPost.category === "Weekly Newsletter" ? (
                  <a
                    href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7434829408936513536"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-success hover:text-success/80 flex items-center transition-colors mt-4"
                  >
                    Subscribe on LinkedIn <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-success font-semibold mt-4 group-hover:underline">
                    Read article <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
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
                  {post.category === "Weekly Newsletter" ? (
                    <a
                      href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7434829408936513536"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm text-success hover:text-success/80 flex items-center transition-colors mt-auto pt-4"
                    >
                      Subscribe on LinkedIn <ArrowRight className="ml-1 h-3 w-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-success font-semibold mt-auto pt-4 group-hover:underline">
                      Read article <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
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
