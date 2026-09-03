import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://elion.com.ng";
  const pages = [
    "",
    "/audit",
    "/demo",
    "/landing/pricing",
    "/landing/about",
    "/landing/support",
    "/privacy",
    "/terms",
    "/status",
  ];

  return pages.map((page) => ({
    url: `${base}${page}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: page === "" ? 1.0 : 0.8,
  }));
}