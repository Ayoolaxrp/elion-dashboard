import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://elion.ng";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/landing", "/funnel", "/audit", "/demo", "/status", "/login"],
        disallow: ["/leads", "/followup", "/booking", "/operations", "/recovery", "/admin", "/api/", "/_next/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
