import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { MarketingShell } from "@/components/layout/marketing-shell";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.intradaymindview.com"),
  title: {
    default: "INTROSPECT™ – The Risk Guardian for Intraday Traders | Intraday MindView Learning",
    template: "%s | INTROSPECT™ – Intraday MindView Learning",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
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
          <MarketingShell>{children}</MarketingShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

