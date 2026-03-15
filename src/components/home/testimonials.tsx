"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    content:
      "I used to blow up my account every few months. INTROSPECT made me realize my biggest enemy was my own emotions. The 30-day challenge changed everything.",
    author: "Rajiv M.",
    role: "Intraday Trader, 3 years",
    rating: 5,
  },
  {
    content:
      "The position sizing calculator alone saved me from a devastating loss. Now I never enter a trade without checking my risk first.",
    author: "Priya S.",
    role: "Options Trader, Bangalore",
    rating: 5,
  },
  {
    content:
      "I was skeptical about a discipline tool, but the daily feedback and mistake detection made me see patterns I was blind to. My discipline score went from 35 to 82 in 60 days.",
    author: "Amit K.",
    role: "Scalper, Nifty Futures",
    rating: 5,
  },
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent pointer-events-none" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
            Trader Stories
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Discipline Changes{" "}
            <span className="gradient-text">Everything</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-base sm:text-lg">
            Real traders. Real transformations. See how INTROSPECT™ helped them
            break destructive patterns.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group"
            >
              <div className="relative h-full p-6 sm:p-8 rounded-2xl bg-card/50 border border-border/50 glass-card hover:border-success/30 transition-all duration-300">
                {/* Quote icon */}
                <Quote className="h-8 w-8 text-success/20 mb-4" />

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: item.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 italic">
                  &ldquo;{item.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-success">
                      {item.author[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
