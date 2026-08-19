import Link from "next/link";
import Image from "next/image";
import { Mail, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  product: [
    { label: "Pricing", href: "/pricing" },
    { label: "How to Use", href: "/how-to-use" },
    { label: "Open Fyers Account", href: "https://fyers.onelink.me/cj1P/c6m75vge", external: true },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact Us", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border/40 bg-muted/30 dark:bg-[#0A0B0D]/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" prefetch={false} className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="INTROSPECT™"
                width={28}
                height={28}
                className="object-contain h-7 w-7"
              />
              <span className="font-heading text-base font-bold text-foreground">
                INTROSPECT
                <span className="text-xs align-super ml-0.5 opacity-60">™</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              The Risk Guardian for Intraday Traders. Track psychological triggers, manage risk parameters, and protect capital.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span>256-bit Encrypted</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading font-bold text-xs text-foreground/90 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  {"external" in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-success transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>{link.label}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-success/15 text-success font-semibold">Free</span>
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-xs text-muted-foreground hover:text-success transition-colors cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-bold text-xs text-foreground/90 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-xs text-muted-foreground hover:text-success transition-colors cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-bold text-xs text-foreground/90 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-xs text-muted-foreground hover:text-success transition-colors cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="opacity-20" />

        {/* Bottom Area */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Intraday MindView Learning. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:intradaymindview@gmail.com"
              className="text-xs text-muted-foreground hover:text-success transition-colors flex items-center gap-1.5"
              aria-label="Email support"
            >
              <Mail className="h-4 w-4" />
              <span>intradaymindview@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-border/10">
          <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed max-w-4xl mx-auto">
            Disclaimer: INTROSPECT™ is a behavioral discipline and risk management tool designed for educational and self-tracking purposes. It does not provide financial advice, trading signals, or investment recommendations. All investment and trading decisions involve high risk and are the sole responsibility of the user. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
