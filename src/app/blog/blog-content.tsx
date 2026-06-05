"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { blogPosts as localBlogPosts } from "./posts";

const categories = [
  "All",
  "Discipline Mondays",
  "Risk-First Fridays",
  "Trading Psychology",
];

const blogPosts = localBlogPosts.map((post) => ({
  title: post.title,
  excerpt: post.excerpt,
  category: post.category,
  date: post.date,
  readTime: post.readTime,
  featured: post.slug === "revenge-trading-destruction",
  slug: post.slug,
  externalUrl: undefined,
}));

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
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-success font-semibold mt-4 hover:underline cursor-pointer"
                >
                  Read Article <ArrowRight className="h-3.5 w-3.5" />
                </Link>
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
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-success font-semibold mt-auto pt-4 hover:underline cursor-pointer"
                  >
                    Read Article <ArrowRight className="h-3 w-3" />
                  </Link>
                </motion.article>
              ))}
            </div>

            {regularPosts.length === 0 && !featuredPost && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">No articles in this category yet.</p>
                <p className="text-sm mt-1">Check back soon!</p>
              </div>
            )}

            {/* Learning Resources Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-20 p-8 sm:p-10 rounded-3xl border border-success/20 bg-success/[0.02] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent pointer-events-none" />
              <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2">
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
                    Intraday MindView Learning Resources
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                    Access direct lectures, training videos, and daily market psychology insights from Venkat Iyer. Subscribe to build your mathematical edge and professional execution mindset.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
                  <a
                    href="https://youtube.com/@intraday.mindview?sub_confirmation=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-success text-success-foreground text-xs font-bold hover:bg-success/90 transition-all shadow-lg shadow-success/10 text-center"
                  >
                    <span>YouTube (English)</span>
                  </a>
                  <a
                    href="https://www.youtube.com/channel/UCTMpGuxQcWKzDtA0TeQsdWQ?sub_confirmation=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-success text-success-foreground text-xs font-bold hover:bg-success/90 transition-all shadow-lg shadow-success/10 text-center"
                  >
                    <span>YouTube (Hindi)</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/venkat-iyer-7839883b2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-success/30 hover:border-success/50 bg-background/50 hover:bg-background text-foreground text-xs font-bold transition-all text-center"
                  >
                    <span>LinkedIn Profile</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
