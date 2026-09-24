import { getDb } from "@/lib/db";

/* Studio sign-in is served straight from Vercel, so nothing in front of it slows a
   password-guessing script down. Failures are counted in Postgres rather than memory
   because each request can land on a different function instance. Both the email and
   the client IP are tracked: one stops a single account being hammered from many
   addresses, the other stops one address walking through many emails. */

const FREE_FAILURES = 5;
const MAX_LOCK_MS = 60 * 60 * 1000;
const DELAY_STEP_MS = 250;
const MAX_DELAY_MS = 2000;

export function loginThrottleKeys(email: string, request: Request) {
  // Vercel overwrites both headers with the real client address, so neither can be spoofed there.
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return [`email:${email}`, `ip:${ip}`];
}

/** Returns true while any of the keys is inside a lockout window. */
export async function isLoginLocked(keys: string[]) {
  const locked = await getDb().loginAttempt.findFirst({
    where: { key: { in: keys }, lockedUntil: { gt: new Date() } },
    select: { key: true },
  });
  return locked !== null;
}

/** Lockout after the fifth failure: 1 min, then doubling per failure up to 1 hour. */
export function lockDurationMs(failures: number) {
  if (failures < FREE_FAILURES) return 0;
  return Math.min(2 ** (failures - FREE_FAILURES) * 60 * 1000, MAX_LOCK_MS);
}

/** Counts a failure against every key, locks any that crossed the threshold, then waits a
    little longer each time so even the free attempts cannot be fired off at full speed. */
export async function recordLoginFailure(keys: string[]) {
  const db = getDb();
  let worst = 0;
  for (const key of keys) {
    const { failures } = await db.loginAttempt.upsert({
      where: { key },
      create: { key, failures: 1 },
      update: { failures: { increment: 1 } },
      select: { failures: true },
    });
    worst = Math.max(worst, failures);
    const lockMs = lockDurationMs(failures);
    if (lockMs > 0) {
      await db.loginAttempt.update({
        where: { key },
        data: { lockedUntil: new Date(Date.now() + lockMs) },
      });
    }
  }
  await new Promise((resolve) =>
    setTimeout(resolve, Math.min(worst * DELAY_STEP_MS, MAX_DELAY_MS)),
  );
}

export async function clearLoginFailures(keys: string[]) {
  await getDb().loginAttempt.deleteMany({ where: { key: { in: keys } } });
}
