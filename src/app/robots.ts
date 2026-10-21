import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin panel is left out on purpose: listing it here would advertise it. Its pages are noindex.
      disallow: ["/auth/", "/account", "/dashboard"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
