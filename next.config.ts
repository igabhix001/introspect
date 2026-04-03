import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
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
              // Scripts: Allow Google Analytics, Hotjar, Razorpay, and Vercel
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com https://script.hotjar.com https://*.contentsquare.net https://vercel.live https://va.vercel-scripts.com",
              // Styles: Allow inline styles and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: Allow Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: Allow various sources
              "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com https://www.googletagmanager.com https://*.hotjar.com https://*.razorpay.com",
              // Connections: Allow API calls to all required services
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lux.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://api-t1.fyers.in https://api.fyers.in https://www.google-analytics.com https://analytics.google.com https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com https://*.contentsquare.net https://*.contentsquare.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
              // Frames: Allow Razorpay checkout and YouTube embeds
              "frame-src 'self' about: https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com https://vars.hotjar.com https://*.contentsquare.net https://*.contentsquare.com",
              // Workers: Allow Hotjar service workers
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
