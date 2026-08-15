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
              // Scripts: Complete allowlist for Next.js, Razorpay, GA4, Clarity, Google OAuth, and Google AdSense
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://accounts.google.com https://apis.google.com https://vercel.live https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com https://*.adservice.google.com https://partner.googleadservices.com https://*.googleadservices.com https://*.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://ep1.adtrafficquality.google https://*.adtrafficquality.google https://www.gstatic.com https://*.gstatic.com https://*.google.com",
              // Styles: Allow inline styles and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              // Fonts: Allow Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: Allow app sources, Supabase, avatars, and Google AdSense creatives
              "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googletagmanager.com https://*.razorpay.com https://lh3.googleusercontent.com https://*.clarity.ms https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com https://*.google.com https://*.googleadservices.com https://*.adtrafficquality.google https://www.gstatic.com https://*.gstatic.com https://*.ggpht.com https://c.bing.com",
              // Connections: Allow APIs, WebSockets, Analytics, Clarity, and AdSense beacons/signals
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lux.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://api-t1.fyers.in https://api.fyers.in https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://accounts.google.com https://oauth2.googleapis.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://adservice.google.com https://*.adservice.google.com https://*.googleadservices.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://*.adtrafficquality.google https://fundingchoicesmessages.google.com https://*.google.com",
              // Frames: Allow Razorpay checkout, YouTube embeds, Google OAuth, and AdSense iframes (including AdTrafficQuality sodar2 frames)
              "frame-src 'self' about: https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com https://*.googleadservices.com https://*.adtrafficquality.google",
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
