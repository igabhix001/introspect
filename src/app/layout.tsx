import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AuthErrorBoundary } from "@/components/providers/error-boundary";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics, Hotjar } from "@/components/analytics";
import { StructuredData } from "@/components/seo/structured-data";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "optional",
  weight: ["600", "700", "800"],
  preload: false,
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: true,
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "optional",
  weight: ["400", "600"],
  preload: false,
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: true,
});

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.intradaymindview.com"),
  title: {
    default: "INTROSPECT™ – Build Trading Discipline, Not Just Strategy",
    template: "%s | INTROSPECT™",
  },
  description:
    "90% of intraday traders lose money. INTROSPECT™ helps you build discipline, manage risk, and protect your capital with personalized rules and coaching. Start your 30-day discipline challenge today.",
  keywords: [
    "intraday trading",
    "risk management",
    "trading discipline",
    "trading journal",
    "INTROSPECT",
    "Intraday MindView Learning",
    "position sizing",
    "trading psychology",
    "stop loss",
    "market sentiment",
    "trading habits",
  ],
  authors: [{ name: "Intraday MindView Learning" }],
  creator: "Intraday MindView Learning",
  publisher: "Intraday MindView Learning",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.intradaymindview.com",
    siteName: "INTROSPECT™ – Intraday MindView Learning",
    title: "INTROSPECT™ – The Risk Guardian for Intraday Traders",
    description:
      "90% of intraday traders lose money. INTROSPECT™ helps you build discipline, manage risk, and protect your capital.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "INTROSPECT™ – The Risk Guardian for Intraday Traders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "INTROSPECT™ – The Risk Guardian for Intraday Traders",
    description:
      "90% of intraday traders lose money. INTROSPECT™ helps you build discipline, manage risk, and protect your capital.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://www.intradaymindview.com" />
        <StructuredData />
      </head>
      <body
        className={`${outfit.variable} ${jakarta.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthErrorBoundary>
            <AuthProvider>
              <ToastProvider>
                <MarketingShell>{children}</MarketingShell>
              </ToastProvider>
            </AuthProvider>
          </AuthErrorBoundary>
          <GoogleAnalytics />
          <Hotjar />
          {process.env.NODE_ENV === "production" && process.env.VERCEL && (
            <>
              <SpeedInsights />
              <Analytics />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}

