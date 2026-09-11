import { updateTag } from "next/cache";
import type { SectionKey } from "@/lib/sections";

export function contentTag(key: SectionKey) {
  return `content:${key}`;
}

export function updateContent(key: SectionKey) {
  updateTag(contentTag(key));
}

// The public pages whose prerendered HTML carries published content.
export const publicPaths = ["/", "/room", "/process"] as const;

/* The studio runs on Vercel and the public site on the Cloudflare Worker, each with its own cache,
   so clearing this deployment's tags leaves the live site serving the old page. This asks the Worker
   to clear its own (`/api/revalidate`). Unset `PUBLIC_SITE_URL` means one server serves both - local
   dev - and there is nothing further to clear. */
export async function refreshLiveSite() {
  const siteUrl = process.env.PUBLIC_SITE_URL;
  if (!siteUrl) return true;

  try {
    const response = await fetch(new URL("/api/revalidate", siteUrl), {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}` },
    });
    if (response.ok) return true;
    console.error(`Refreshing the live site answered ${response.status}`);
  } catch (error) {
    console.error("Refreshing the live site failed", error);
  }
  return false;
}
