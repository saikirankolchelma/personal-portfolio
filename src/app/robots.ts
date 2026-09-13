import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The dashboard and API surface are private; keep them out of indexes.
      disallow: ["/dashboard", "/dashboard/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
