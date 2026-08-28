import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://elion.ng";
  const pages = [
    "",
    "/landing",
    "/landing/audit",
    "/landing/leads",
    "/landing/followup",
    "/landing/recovery",
    "/landing/booking",
    "/landing/operations",
    "/landing/pricing",
    "/landing/about",
  ];

  return pages.map((page) => ({
    url: `${base}${page}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: page === "" ? 1.0 : page.startsWith("/landing") ? 0.8 : 0.6,
  }));
}
