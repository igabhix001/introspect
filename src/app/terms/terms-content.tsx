"use client";

import { motion } from "framer-motion";
import { FileText, AlertTriangle, CreditCard, Ban, Scale, Clock, Shield, HelpCircle } from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using INTROSPECT™ (operated by Intraday MindView Learning), you agree to be bound by these Terms of Service. If you do not agree, please do not use the service. These terms apply to all users, including visitors, registered users, and subscribers.",
  },
  {
    icon: Shield,
    title: "2. Description of Service",
    content:
      "INTROSPECT™ is a trading discipline and risk management SaaS platform. It provides risk assessment, personalized trading rules, trade journaling, position sizing, daily discipline reports, and market sentiment. INTROSPECT™ does NOT provide investment advice, stock recommendations, or trading signals. All educational content is for informational purposes only.",
  },
  {
    icon: CreditCard,
    title: "3. Subscriptions & Payments",
    content:
      "INTROSPECT™ offers Monthly (₹333/month), 6-Month (₹1,836), and Yearly (₹3,654/year) plans. All inclusive pricing — no hidden charges. Payments are processed securely via Razorpay. Subscriptions auto-renew unless cancelled before the billing period ends. After cancellation, access continues until the end of the paid period. Refunds are available within 7 days of initial purchase if the service hasn't been substantially used.",
  },
  {
    icon: Ban,
    title: "4. Prohibited Conduct",
    content:
      "You may not: reverse-engineer or attempt to extract the source code; use the service for automated trading or bot operation; share your credentials or allow unauthorized access; scrape, copy, or redistribute any content; use the service for any illegal activity; upload malicious content or attempt to compromise security.",
  },
  {
    icon: AlertTriangle,
    title: "5. Disclaimer — Not Financial Advice",
    content:
      "INTROSPECT™ is a discipline and risk management tool, NOT a financial advisor. We do not recommend specific trades, stocks, or strategies. Trading in financial markets involves substantial risk of loss. Past performance (yours or anyone else's) does not guarantee future results. You are solely responsible for your trading decisions. We are not registered investment advisors.",
  },
  {
    icon: Scale,
    title: "6. Limitation of Liability",
    content:
      "Intraday MindView Learning shall not be liable for any trading losses, indirect damages, loss of profits, or consequential damages arising from your use of INTROSPECT™. Our total liability is limited to the subscription fees you have paid in the last 12 months. The service is provided 'as is' without warranties of merchantability or fitness for a particular purpose.",
  },
  {
    icon: Clock,
    title: "7. Account Termination",
    content:
      "We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time via Settings → Delete Account, or by contacting support. Upon termination, your data is retained for 90 days (in case you return), then permanently deleted. You can request immediate deletion by contacting privacy@intradaymindview.com.",
  },
  {
    icon: HelpCircle,
    title: "8. Governing Law & Disputes",
    content:
      "These terms are governed by the laws of India. Any disputes shall be resolved through arbitration in accordance with the Indian Arbitration and Conciliation Act, with the seat of arbitration in New Delhi. For minor disputes, we encourage you to contact us first at support@intradaymindview.com.",
  },
];

export function TermsContent() {
  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-4">
            Legal
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Terms of <span className="gradient-text">Service</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            The rules of engagement for using INTROSPECT™. Please read
            carefully before signing up.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Last updated: March 1, 2026 • Effective immediately
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="rounded-2xl border border-border/50 bg-card/50 p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-success" />
                  </div>
                  <h2 className="font-heading text-lg font-bold">{section.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 p-6 rounded-2xl border border-border/50 bg-card/50 text-center"
        >
          <p className="text-sm text-muted-foreground">
            By using INTROSPECT™, you acknowledge that you have read, understood,
            and agree to these Terms of Service.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Questions? Contact{" "}
            <a href="mailto:support@intradaymindview.com" className="text-success hover:underline">
              support@intradaymindview.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
