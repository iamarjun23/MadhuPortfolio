import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

/* Studio sign-in is served straight from Vercel, so nothing in front of it slows a
   password-guessing script down. Attempts are counted in Postgres rather than memory
   because each request can land on a different function instance. Both the email and
   the client IP are tracked: one stops a single account being hammered from many
   addresses, the other stops one address walking through many emails.

   An email lock alone would let anyone who knows the owner's email keep the owner out,
   so an address the owner has signed in from before ("trusted") is not held back by the
   email lock — only by its own IP lock. */

const FREE_ATTEMPTS = 5;
const MAX_LOCK_MINUTES = 60;
const DELAY_STEP_MS = 250;
const MAX_DELAY_MS = 2000;

export type LoginThrottleKeys = Readonly<{
  ipKey: string;
  emailKey: string;
  /** Marks an address the owner has signed in from; null when the address is unknown. */
  trustedKey: string | null;
}>;

export function loginThrottleKeys(email: string, headers: Headers): LoginThrottleKeys {
  // Vercel overwrites both headers with the real client address, so neither can be spoofed there.
  const ip =
    headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return {
    ipKey: `ip:${ip}`,
    emailKey: `email:${email}`,
    // A shared "unknown" bucket must never become trusted, or it would bypass the email lock for everyone.
    trustedKey: ip === "unknown" ? null : `trusted:${email}|${ip}`,
  };
}

// LoginAttempt timestamps are written by Prisma as UTC in a timezone-less column.
const NOW = Prisma.sql`(now() AT TIME ZONE 'UTC')`;

/** Counts one attempt against `key` and returns the new count, or null while the key is
    locked. Check, increment and lock happen in one statement, so parallel attempts cannot
    all slip past the check before any of them is counted. Lockout starts at the fifth
    attempt: 1 min, doubling per attempt up to an hour. A key left alone for a day starts
    from scratch, so old typos do not turn the next single mistake into an hour's lock. */
async function countAttempt(key: string) {
  const count = Prisma.sql`CASE WHEN "LoginAttempt"."updatedAt" < ${NOW} - interval '1 day'
    THEN 1 ELSE "LoginAttempt"."failures" + 1 END`;
  const rows = await getDb().$queryRaw<{ failures: number }[]>`
    INSERT INTO "LoginAttempt" ("key", "failures", "lockedUntil", "updatedAt")
    VALUES (${key}, 1, NULL, ${NOW})
    ON CONFLICT ("key") DO UPDATE SET
      "failures" = ${count},
      "lockedUntil" = CASE WHEN ${count} >= ${FREE_ATTEMPTS}
        THEN ${NOW} + LEAST(power(2, ${count} - ${FREE_ATTEMPTS}), ${MAX_LOCK_MINUTES}) * interval '1 minute'
        ELSE NULL END,
      "updatedAt" = ${NOW}
    WHERE "LoginAttempt"."lockedUntil" IS NULL OR "LoginAttempt"."lockedUntil" <= ${NOW}
    RETURNING "failures"`;
  return rows[0]?.failures ?? null;
}

async function isTrusted(trustedKey: string | null) {
  if (!trustedKey) return false;
  const row = await getDb().loginAttempt.findUnique({
    where: { key: trustedKey },
    select: { key: true },
  });
  return row !== null;
}

/* Every new email or address adds a row, so rows that can no longer matter are dropped as
   attempts come in: counters idle for a day (they would restart from zero anyway, and are
   no longer locked) and trusted addresses the owner has not signed in from for 90 days. */
async function pruneStaleAttempts() {
  await getDb().$executeRaw`
    DELETE FROM "LoginAttempt"
    WHERE ("key" NOT LIKE 'trusted:%' AND "updatedAt" < ${NOW} - interval '1 day'
           AND ("lockedUntil" IS NULL OR "lockedUntil" <= ${NOW}))
       OR ("key" LIKE 'trusted:%' AND "updatedAt" < ${NOW} - interval '90 days')`;
}

/** Counts this attempt before the password is checked. `allowed` is false while the IP is
    locked, or while the email is locked and this address has never signed the owner in. */
export async function reserveLoginAttempt(keys: LoginThrottleKeys) {
  await pruneStaleAttempts();
  const ipCount = await countAttempt(keys.ipKey);
  if (ipCount === null) return { allowed: false, attempts: 0 } as const;
  const emailCount = await countAttempt(keys.emailKey);
  if (emailCount === null && !(await isTrusted(keys.trustedKey))) {
    return { allowed: false, attempts: 0 } as const;
  }
  return { allowed: true, attempts: Math.max(ipCount, emailCount ?? 0) } as const;
}

/** Waits a little longer after each failed attempt so even the free ones cannot be fired off at full speed. */
export async function delayAfterFailure(attempts: number) {
  await new Promise((resolve) =>
    setTimeout(resolve, Math.min(attempts * DELAY_STEP_MS, MAX_DELAY_MS)),
  );
}

/** Clears the counters a correct password earned and remembers this address as the owner's. */
export async function recordLoginSuccess(keys: LoginThrottleKeys) {
  const db = getDb();
  await db.loginAttempt.deleteMany({ where: { key: { in: [keys.ipKey, keys.emailKey] } } });
  if (keys.trustedKey) {
    await db.loginAttempt.upsert({
      where: { key: keys.trustedKey },
      create: { key: keys.trustedKey, failures: 0 },
      // Writing a field bumps `updatedAt`, which is what keeps a used address from being pruned.
      update: { failures: 0 },
    });
  }
}
