import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const siteUrl = getSiteUrl(settings.domain);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio/", "/login", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
