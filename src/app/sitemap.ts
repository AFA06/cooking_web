import { MetadataRoute } from "next";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { SITE_URL } from "@/lib/site-url";
import { listCreators, listPublishedRecipes } from "@/server/recipes";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [RECIPES, CREATORS] = await Promise.all([listPublishedRecipes(), listCreators()]);
  const baseUrl = SITE_URL;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}${PLATFORM_CONFIG.urls.recipes}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}${PLATFORM_CONFIG.urls.becomeCreator}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...RECIPES.map((r) => ({
      url: `${baseUrl}/recipes/${r.slug}`,
      lastModified: new Date(r.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...CREATORS.map((c) => ({
      url: `${baseUrl}/creators/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
