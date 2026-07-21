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
    "/disclaimer",
    "/auth/login",
    "/auth/signup",
  ];

  const staticRoutes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === "" ? "daily" as const : "weekly" as const,
    priority: route === "" ? 1 : route === "/pricing" ? 0.9 : 0.8,
  }));

  // Blog posts (local, SEO-optimized)
  const blogPostSlugs = [
    "revenge-trading-destruction",
    "atr-position-sizing",
    "nifty-breadth-sentiment",
    "30-day-discipline-challenge",
    "trading-journal-psychology",
    "fo-trading-loss-prevention-sebi-study",
    "one-percent-risk-rule-bank-nifty",
  ];

  const blogRoutes = blogPostSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...blogRoutes];
}
