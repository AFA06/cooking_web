import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/creator/", "/admin/", "/api/"],
    },
    sitemap: "https://damda.uz/sitemap.xml",
  };
}