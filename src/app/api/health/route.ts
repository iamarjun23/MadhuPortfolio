import { getDb, isDatabaseConfigured } from "@/lib/db";
import { headObject, isMediaUploadConfigured } from "@/lib/media-config";
import { hasRevalidateSecret } from "@/lib/revalidate";

/* One request that says whether the parts a publish depends on are reachable, for an uptime
   monitor or a quick look after a deploy. `/api/ping` stays the cheap liveness probe the studio
   polls. Each check runs only where its settings exist: the Worker has the database; the studio
   (Vercel) also has the R2 credentials and the live-site refresh. Anyone gets the overall status
   (200 / 503); which check failed is only shown with `Authorization: Bearer <REVALIDATE_SECRET>`,
   and the reason goes to the log ("Health check"). */

// ponytail: per-instance cache, so a burst of requests to one instance runs the checks once.
// Each new instance still runs them on its first request.
const RESULT_TTL_MS = 10_000;
let lastResult: { at: number; ok: boolean; checks: Record<string, CheckResult> } | undefined;

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
async function checkLiveRefresh(siteUrl: string, secret: string) {
  const response = await fetch(new URL("/api/revalidate", siteUrl), {
    headers: { authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  if (response.status !== 204) throw new Error(`the live site answered ${response.status}`);
}

async function runChecks() {
  if (lastResult && Date.now() - lastResult.at < RESULT_TTL_MS) return lastResult;
  const siteUrl = process.env.PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  const skipped: CheckResult = "not configured";
  const [database, media, liveRefresh] = await Promise.all([
    isDatabaseConfigured() ? runCheck("database", checkDatabase) : skipped,
    isMediaUploadConfigured() ? runCheck("media", checkMedia) : skipped,
    siteUrl && secret ? runCheck("liveRefresh", () => checkLiveRefresh(siteUrl, secret)) : skipped,
  ]);
  const checks: Record<string, CheckResult> = { database, media, liveRefresh };
  lastResult = { at: Date.now(), ok: !Object.values(checks).includes("failed"), checks };
  return lastResult;
}

export async function GET(request: Request) {
  const { ok, checks } = await runChecks();
  return Response.json(hasRevalidateSecret(request) ? { ok, checks } : { ok }, {
    status: ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
