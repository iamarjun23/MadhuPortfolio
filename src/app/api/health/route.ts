import { getDb, isDatabaseConfigured } from "@/lib/db";
import { headObject, isMediaUploadConfigured } from "@/lib/media-config";

/* One request that says whether the parts a publish depends on are reachable, for an uptime
   monitor or a quick look after a deploy. `/api/ping` stays the cheap liveness probe the studio
   polls. Each check runs only where its settings exist: the Worker has the database; the studio
   (Vercel) also has the R2 credentials and the live-site refresh. The body says only ok / failed
   per check; the reason goes to the log ("Health check"). */

export const dynamic = "force-dynamic";

type CheckResult = "ok" | "failed" | "not configured";

const CHECK_TIMEOUT_MS = 5000;

async function runCheck(name: string, check: () => Promise<void>): Promise<CheckResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS} ms`)),
      CHECK_TIMEOUT_MS,
    );
  });
  try {
    await Promise.race([check(), timeout]);
    return "ok";
  } catch (error) {
    console.error(`Health check "${name}" failed`, error);
    return "failed";
  } finally {
    clearTimeout(timer);
  }
}

async function checkDatabase() {
  await getDb().$queryRaw`SELECT 1`;
}

// A HEAD for a key that never exists: 404 proves the credentials and bucket work, 403 does not.
async function checkMedia() {
  const response = await headObject("health-check");
  if (response.status !== 200 && response.status !== 404) {
    throw new Error(`R2 answered ${response.status}`);
  }
}

// The Worker's GET /api/revalidate only confirms the secret; it clears nothing.
async function checkLiveRefresh(siteUrl: string) {
  const response = await fetch(new URL("/api/revalidate", siteUrl), {
    headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}` },
    cache: "no-store",
  });
  if (response.status !== 204) throw new Error(`the live site answered ${response.status}`);
}

export async function GET() {
  const siteUrl = process.env.PUBLIC_SITE_URL;
  const [database, media, liveRefresh] = await Promise.all([
    isDatabaseConfigured() ? runCheck("database", checkDatabase) : "not configured",
    isMediaUploadConfigured() ? runCheck("media", checkMedia) : "not configured",
    siteUrl ? runCheck("liveRefresh", () => checkLiveRefresh(siteUrl)) : "not configured",
  ]);
  const checks = { database, media, liveRefresh };
  const ok = !Object.values(checks).includes("failed");

  return Response.json(
    { ok, checks },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
