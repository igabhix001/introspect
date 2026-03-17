"use client";

import { motion } from "framer-motion";
import { Mail, MessageSquare, HelpCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      "Currently, INTROSPECT™ is optimized for Indian intraday markets (Nifty 50, BankNifty). Global market support (S&P 500, FTSE, etc.) is planned for future releases.",
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
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have questions about INTROSPECT™, coaching, or partnerships?
            We&apos;d love to hear from you.
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

              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Your Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="What is this regarding?"
                    className="bg-background/50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="bg-background/50 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-success hover:bg-success/90 text-success-foreground font-semibold py-5 rounded-xl group cursor-pointer"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="mt-6 p-6 rounded-2xl bg-card/50 border border-border/50 glass-card">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10">
                  <Mail className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email us at</p>
                  <p className="text-sm text-muted-foreground">
                    contact@intradaymindview.com
                  </p>
                </div>
              </div>
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
                  value={i}
                  className="border border-border/50 rounded-xl px-5 data-[state=open]:bg-card/50 transition-colors"
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
