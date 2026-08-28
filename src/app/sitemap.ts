import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  const siteUrl = getSiteUrl(settings.domain);

  return ["/", "/process", "/room"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
