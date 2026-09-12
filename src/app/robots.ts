import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://elion.com.ng";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/funnel", "/audit", "/demo", "/products", "/status", "/login", "/about", "/docs", "/pricing", "/methodology", "/support", "/book", "/privacy", "/terms", "/cookie-policy", "/acceptable-use", "/third-party-services"],
        disallow: ["/leads", "/followup", "/booking", "/operations", "/recovery", "/admin", "/api/", "/_next/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
