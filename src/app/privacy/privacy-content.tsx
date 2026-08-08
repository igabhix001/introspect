"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, Globe, Mail, Trash2, RefreshCw } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      "Account information: name, email address, phone number (optional)",
      "Trading data: trade entries, journal notes, assessment responses (encrypted at rest)",
      "Usage data: pages visited, features used, device information, IP address",
      "Payment data: processed securely through Razorpay — we never store card numbers",
    ],
  },
  {
    icon: Eye,
    title: "How We Use Your Data",
    content: [
      "To provide the INTROSPECT™ service: risk assessment, personalized rules, trade journal, daily reports",
      "To improve our service through aggregated, anonymized analytics",
      "To send you important account notifications and security alerts",
      "To process payments and manage subscriptions",
      "We NEVER sell your personal data to third parties",
    ],
  },
  {
    icon: Shield,
    title: "Data Security",
    content: [
      "All data transmitted over HTTPS with TLS 1.3 encryption",
      "Trading data encrypted at rest using AES-256 encryption in our database",
      "Row Level Security (RLS) ensures you can only access your own data",
      "Regular security audits and penetration testing",
      "SOC 2 compliant infrastructure via Supabase",
    ],
  },
  {
    icon: Lock,
    title: "Data Sharing",
    content: [
      "Razorpay: payment processing only — they don't receive your trading data",
      "Third-party data provider APIs: market data only (if connected) — your trades stay private",
      "No data is shared with advertisers, brokers, or trading firms",
      "We may share anonymized, aggregate insights (e.g., '72% of users improved discipline in 30 days')",
    ],
  },
  {
    icon: Trash2,
    title: "Data Retention & Deletion",
    content: [
      "Active accounts: data stored as long as your subscription is active",
      "After cancellation: data preserved for 90 days, then permanently deleted",
      "You can request immediate deletion by emailing support@intradaymindview.com",
      "Export your trade journal data at any time as CSV/PDF",
    ],
  },
  {
    icon: Globe,
    title: "Cookies, Advertising & Third-Party Vendors",
    content: [
      "Essential Cookies: Used strictly for secure authentication, session management, and user preference persistence.",
      "Third-Party Advertising: We use third-party advertising companies like Google AdSense to serve ads when you visit our public tools and pages.",
      "Google DART Cookies: Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.",
      "Opting Out of Personalized Ads: Users may opt out of personalized advertising by visiting Google Ads Settings (https://adssettings.google.com) or the Network Advertising Initiative opt-out page (https://optout.networkadvertising.org) and Digital Advertising Alliance (https://optout.aboutads.info).",
      "Google Privacy Policy: To learn more about how Google uses data when you use our site, visit Google's Privacy & Terms at https://policies.google.com/technologies/ads.",
      "Ad-Free for Subscribers: Logged-in active Pro subscribers enjoy a 100% ad-free experience with zero third-party advertising tracking.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Policy Updates",
    content: [
      "We will notify you of material changes via email and in-app notification",
      "Continued use after 30 days of notification constitutes acceptance",
      "Previous versions of this policy are available upon request",
    ],
  },
];

export function PrivacyContent() {
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
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Your trading data is sacred. Here&apos;s exactly how INTROSPECT™ collects,
            uses, and protects it.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Last updated: March 1, 2026 • Effective immediately
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="rounded-2xl border border-border/50 bg-card/50 p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-success" />
                  </div>
                  <h2 className="font-heading text-lg font-bold">{section.title}</h2>
                </div>
                <ul className="space-y-2.5">
                  {section.content.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-success/50 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 rounded-2xl border border-border/50 bg-card/50 p-6 sm:p-8 text-center"
        >
          <Mail className="h-6 w-6 text-success mx-auto mb-3" />
          <h3 className="font-heading font-bold mb-2">Questions?</h3>
          <p className="text-sm text-muted-foreground">
            Contact our Data Protection Officer at{" "}
            <a href="mailto:privacy@intradaymindview.com" className="text-success hover:underline">
              privacy@intradaymindview.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
