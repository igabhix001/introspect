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
    "/dashboard/sentiment",
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

  return [...staticRoutes, ...dashboardRoutes];
}
