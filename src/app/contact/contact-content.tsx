"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, MessageSquare, HelpCircle, Send, Phone, ArrowRight, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdBanner } from "@/components/ads/google-adsense";


const faqs = [
  {
    question: "What is INTROSPECT™?",
    answer:
      "INTROSPECT™ is a web-based risk management and trading discipline tool for intraday traders. It assesses your trading behavior, generates personalized rules, and helps you build consistent habits through daily tracking and challenges.",
  },
  {
    question: "Is INTROSPECT™ a trading strategy or advisory?",
    answer:
      "No. INTROSPECT™ is strictly a risk management and discipline tool. It does not provide buy/sell recommendations. Your trading strategy and decisions are entirely your own. We help you execute them with discipline.",
  },
  {
    question: "Which markets does it support?",
    answer:
      "Currently, INTROSPECT™ is optimized for Indian intraday markets (Nifty 50, BankNifty).",
  },
  {
    question: "How does the 30-Day Challenge work?",
    answer:
      "The 30-Day Challenge is a habit-building system where you commit to following specific trading rules (stop-loss on every trade, risk limits, no revenge trading, etc.) for 30 consecutive days. Complete it, and you unlock the 60-Day and 90-Day mastery challenges.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes, you can cancel anytime. There are no lock-in periods. If you cancel, you'll retain access until the end of your current billing cycle.",
  },
  {
    question: "Is my trading data secure?",
    answer:
      "Absolutely. We use industry-standard 256-bit encryption, HTTPS/SSL, and follow best security practices. Payment data is never stored on our servers — it's handled by Razorpay directly.",
  },
];

export function ContactContent() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
            Contact
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Contact <span className="gradient-text">Support</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have a question about your subscription, platform features, or risk assessment?
            Our team responds within 2–4 hours during market hours (9 AM – 4 PM IST).
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="p-6 sm:p-8 rounded-2xl bg-card/50 border border-border/50 glass-card">
              <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-success" />
                Send us a message
              </h2>

              {success ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-6">We&apos;ll get back to you within 2-4 hours.</p>
                  <Button onClick={() => setSuccess(false)} variant="outline">
                    Send Another Message
                  </Button>
                </div>
              ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="text-sm font-medium mb-1.5 block text-foreground/80"
                    >
                      Your Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      className="bg-background/40 border-border/50 focus:border-success/50 focus:ring-2 focus:ring-success/20 transition-all duration-300"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="text-sm font-medium mb-1.5 block text-foreground/80"
                    >
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-background/40 border-border/50 focus:border-success/50 focus:ring-2 focus:ring-success/20 transition-all duration-300"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="text-sm font-medium mb-1.5 block text-foreground/80"
                  >
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="What is this regarding?"
                    className="bg-background/40 border-border/50 focus:border-success/50 focus:ring-2 focus:ring-success/20 transition-all duration-300"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="text-sm font-medium mb-1.5 block text-foreground/80"
                  >
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="bg-background/40 border-border/50 focus:border-success/50 focus:ring-2 focus:ring-success/20 transition-all duration-300 resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold py-5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-[1.01] transition-all duration-300 group cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-6 space-y-4">
              {/* Email */}
              <div className="p-5 rounded-2xl bg-card/50 border border-border/50 glass-card">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-success/10">
                    <Mail className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email us at</p>
                    <a 
                      href="mailto:intradaymindview@gmail.com"
                      className="text-sm text-success hover:underline"
                    >
                      intradaymindview@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <a
                href="https://wa.me/919009906032?text=Hi%2C%20I%20have%20a%20question%20about%20INTROSPECT"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#25D366]/20">
                    <Phone className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">WhatsApp Support</p>
                    <p className="text-xs text-muted-foreground">Click to chat with us</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#25D366]" />
                </div>
              </a>

              {/* Response Time */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-muted-foreground">
                    We typically respond within <span className="text-foreground font-medium">2-4 hours</span> during market hours (9 AM - 4 PM IST)
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-success/10 to-transparent border border-success/20">
              <h3 className="font-heading text-lg font-bold mb-2">Ready to start?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Don&apos;t wait for the perfect moment. Check your discipline score now.
              </p>
              <Link
                href="/dashboard/assessment"
                className="inline-flex items-center bg-success hover:bg-success/90 text-success-foreground font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Start Your Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* AdBanner */}
            <div className="mt-8">
              <AdBanner slot="1992174832" format="auto" />
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div

            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-success" />
              Frequently Asked Questions
            </h2>

            <Accordion className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={i.toString()}
                  className="border border-border/50 rounded-xl px-5 data-[state=open]:bg-card/40 data-[state=open]:border-success/20 hover:border-success/20 transition-all duration-300"
                >
                  <AccordionTrigger className="text-sm font-medium hover:no-underline cursor-pointer py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
