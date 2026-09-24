import { updateTag } from "next/cache";
import { after } from "next/server";
import type { SectionKey } from "@/lib/sections";

export function contentTag(key: SectionKey) {
  return `content:${key}`;
}

export function updateContent(key: SectionKey) {
  updateTag(contentTag(key));
}

// The public pages whose prerendered HTML carries published content.
export const publicPaths = ["/", "/room", "/resume"] as const;

/* The studio runs on Vercel and the public site on the Cloudflare Worker, each with its own cache,
   so clearing this deployment's tags leaves the live site serving the old page. This asks the Worker
   to clear its own (`/api/revalidate`). Unset `PUBLIC_SITE_URL` means one server serves both - local
   dev - and there is nothing further to clear. On Vercel it is a misconfiguration, not success
   (production builds refuse to start without it; see next.config.mjs). */
export async function refreshLiveSite() {
  const siteUrl = process.env.PUBLIC_SITE_URL;
  if (!siteUrl) {
    if (!process.env.VERCEL) return true;
    console.error("Refreshing the live site skipped: PUBLIC_SITE_URL is not set");
    return false;
  }

  try {
    const response = await fetch(new URL("/api/revalidate", siteUrl), {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}` },
    });
    if (response.ok) {
      /* The first request after a clear re-renders the page (~3-4s). Make that request ourselves,
         once the publish response has gone out, so no visitor is the one who waits. One at a time:
         parallel renders of the same page collide on the R2 cache write (error 10058). The
         content is already fresh by now, so a failed warm-up only costs the next visitor that
         wait; it is logged rather than reported back to the studio. */
      after(async () => {
        for (const path of publicPaths) {
          try {
            const page = await fetch(new URL(path, siteUrl), { cache: "no-store" });
            if (!page.ok) console.error(`Warming ${path} after publish answered ${page.status}`);
          } catch (error) {
            console.error(`Warming ${path} after publish failed`, error);
          }
        }
      });
      return true;
    }
    console.error(`Refreshing the live site answered ${response.status}`);
  } catch (error) {
    console.error("Refreshing the live site failed", error);
  }
  return false;
}
