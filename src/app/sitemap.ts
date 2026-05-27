import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.intradaymindview.com";
  const currentDate = new Date().toISOString();

  // Static pages
  const staticPages = [
    "",
    "/about",
    "/pricing",
    "/contact",
    "/blog",
    "/how-to-use",
    "/privacy",
    "/terms",
    "/auth/login",
    "/auth/signup",
  ];

  const staticRoutes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === "" ? "daily" as const : "weekly" as const,
    priority: route === "" ? 1 : route === "/pricing" ? 0.9 : 0.8,
  }));

  // Dashboard pages (lower priority, require auth)
  const dashboardPages = [
    "/dashboard",
    "/dashboard/assessment",
    "/dashboard/risk-report",
    "/dashboard/journal",
    "/dashboard/calculator",
    "/dashboard/challenges",
    "/dashboard/analytics",
    "/dashboard/loyalty",
    "/dashboard/payments",
    "/dashboard/daily-report",
    "/dashboard/settings",
  ];

  const dashboardRoutes = dashboardPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Blog posts (local, SEO-optimized)
  const blogPostSlugs = [
    "revenge-trading-destruction",
    "atr-position-sizing",
    "nifty-breadth-sentiment",
    "30-day-discipline-challenge",
    "trading-journal-psychology",
  ];

  const blogRoutes = blogPostSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...blogRoutes, ...dashboardRoutes];
}
