import type { MetadataRoute } from "next";
import { Status } from "@/generated/prisma/client";
import { getSectionVersion, getSettings } from "@/lib/content";
import { sectionKeys } from "@/lib/sections";
import { getSiteUrl } from "@/lib/site-url";

/* Every publish rewrites all the published rows, so the newest of their timestamps is when the
   site last changed. Read from the same cached query the pages use, so this costs no extra
   database round trip and refreshes with them on publish. */
async function lastPublished() {
  const versions = await Promise.all(
    sectionKeys.map((key) => getSectionVersion(key, Status.PUBLISHED)),
  );
  const latest = versions
    .filter((version) => version !== null)
    .sort()
    .at(-1);
  return latest ? new Date(latest) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, lastModified] = await Promise.all([getSettings(), lastPublished()]);
  const siteUrl = getSiteUrl(settings.domain);

  return ["/", "/resume", "/room"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified,
  }));
}
