import type { MetadataRoute } from "next";
import { DOC_ARTICLES_FLAT, DOC_CATEGORIES } from "@/content/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://elion.com.ng";
  const pages = [
    "",
    "/audit",
    "/demo",
    "/docs",
    "/landing/book",
    "/landing/pricing",
    "/landing/about",
    "/landing/support",
    "/privacy",
    "/terms",
    "/cookie-policy",
    "/acceptable-use",
    "/third-party-services",
    "/status",
  ];

  const staticEntries = pages.map((page) => ({
    url: `${base}${page}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: page === "" ? 1.0 : page.startsWith("/docs") ? 0.7 : 0.8,
  }));

  const docsEntries: MetadataRoute.Sitemap = DOC_CATEGORIES.flatMap((cat) => [
    {
      url: `${base}/docs/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    ...cat.articles.map((a) => ({
      url: `${base}/docs/${cat.slug}/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]);

  return [...staticEntries, ...docsEntries];
}
