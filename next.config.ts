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
              // Scripts: Allow Google Analytics, Microsoft Clarity, Razorpay, Google OAuth, Vercel, and Google AdSense
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://accounts.google.com https://apis.google.com https://vercel.live https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com https://*.adservice.google.com https://partner.googleadservices.com https://*.doubleclick.net https://tpc.googlesyndication.com",
              // Styles: Allow inline styles and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              // Fonts: Allow Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: Allow various sources including Google avatars and AdSense ad images
              "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com https://www.googletagmanager.com https://*.razorpay.com https://lh3.googleusercontent.com https://*.clarity.ms https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com https://*.google.com https://c.bing.com",
              // Connections: Allow API calls to all required services including AdSense beacons
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lux.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://api-t1.fyers.in https://api.fyers.in https://www.google-analytics.com https://analytics.google.com https://www.clarity.ms https://*.clarity.ms https://accounts.google.com https://oauth2.googleapis.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://adservice.google.com https://*.adservice.google.com https://googleads.g.doubleclick.net",
              // Frames: Allow Razorpay checkout, YouTube embeds, Google OAuth, and AdSense iframes
              "frame-src 'self' about: https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://*.googlesyndication.com https://*.doubleclick.net https://tpc.googlesyndication.com https://googleads.g.doubleclick.net",
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
