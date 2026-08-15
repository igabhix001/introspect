import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,

  // Performance optimizations
  experimental: {
    inlineCss: true,
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@supabase/supabase-js",
      "date-fns",
    ],
  },

  // Image optimization - WebP/AVIF
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },

  // Compression
  compress: true,

  // Security headers (Client requirement: Sec 7 – Security Headers)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: 'strict-dynamic' + https: is Google's officially recommended CSP for AdSense.
              // It trusts any script loaded by a trusted script, future-proofing against Google's changing infra.
              // 'unsafe-inline' and 'unsafe-eval' are fallbacks for older browsers (ignored by modern ones when strict-dynamic is present).
              // Explicit origins still needed for first-party trusted scripts (GTM, Razorpay, Clarity, etc.)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'strict-dynamic' https: https://checkout.razorpay.com https://*.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://accounts.google.com https://apis.google.com https://vercel.live https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com",
              // Styles: Allow inline styles and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              // Fonts: Allow Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: Allow app sources + all Google ad image domains (ads load images from many Google CDNs)
              "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com https://www.googletagmanager.com https://*.razorpay.com https://lh3.googleusercontent.com https://*.clarity.ms https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://www.gstatic.com https://*.ggpht.com https://c.bing.com",
              // Connections: App APIs + all Google ad beacon/auction/quality domains
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lux.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://api-t1.fyers.in https://api.fyers.in https://www.google-analytics.com https://analytics.google.com https://www.clarity.ms https://*.clarity.ms https://accounts.google.com https://oauth2.googleapis.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adservice.google.com https://*.adtrafficquality.google https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com",
              // Frames: App iframes + all Google ad iframe domains (AdSense renders ads inside iframes)
              "frame-src 'self' about: https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://fundingchoicesmessages.google.com",
              // Workers: Allow service workers
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
