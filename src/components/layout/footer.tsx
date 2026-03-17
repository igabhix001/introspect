import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  product: [
    { label: "INTROSPECT™ Tool", href: "/#features" },
    { label: "Risk Assessment", href: "/#features" },
    { label: "Trade Journal", href: "/#features" },
    { label: "Market Sentiment", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/contact" },
  ],
  resources: [
    { label: "Discipline Guide", href: "/blog" },
    { label: "Risk-First Fridays", href: "/blog" },
    { label: "Discipline Mondays", href: "/blog" },
    { label: "FAQ", href: "/pricing#faq" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-muted/30">
      {/* Signature Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-3">
              Intraday MindView Learning
            </p>
            <p className="text-xl sm:text-2xl font-heading font-bold mb-4">
              90% lose. We fix the missing piece:{" "}
              <span className="gradient-text">discipline</span>.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-success hover:text-success/80 font-semibold transition-colors group cursor-pointer"
            >
              Discover INTROSPECT™
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      <Separator />

      {/* Links Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="INTROSPECT™"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-heading text-lg font-bold">
                INTROSPECT
                <span className="text-xs align-super ml-0.5 opacity-60">™</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              The Risk Guardian for Intraday Traders. Build discipline, protect
              capital, trade consistently.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span>256-bit Encrypted</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Intraday MindView Learning. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="mailto:contact@intradaymindview.com"
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-sm sm:text-base text-muted-foreground/80 text-center leading-relaxed max-w-4xl mx-auto font-medium">
            INTROSPECT™ is a risk management tool, not a trading strategy. It
            helps you protect capital, track discipline, and avoid common
            mistakes. Your entry, exit, and strategy decisions are yours alone.
            This tool does not constitute investment advice, financial advice, or
            a recommendation to buy or sell any financial instrument. Users
            should conduct their own research before making financial decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
