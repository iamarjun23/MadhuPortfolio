import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@prisma/client";

declare global {
  var madhuPrisma: PrismaClient | undefined;
}

function withExplicitSslMode(databaseUrl: string) {
  return databaseUrl.replace(
    /([?&]sslmode=)(?:prefer|require|verify-ca)(?=(&|$))/i,
    "$1verify-full",
  );
}

// On Cloudflare Workers a Hyperdrive binding proxies the TCP connection (Workers can't open raw
// TCP sockets to Postgres directly). Outside Workers (local `next start`, migrations, scripts)
// there is no Cloudflare context, so fall back to DATABASE_URL.
function getHyperdriveConnectionString() {
  try {
    const { env } = getCloudflareContext();
    return env.HYPERDRIVE?.connectionString;
  } catch {
    // Not running inside a Cloudflare Worker request.
  }
}

// Cloudflare Workers connect through the Hyperdrive binding, while local scripts and builds use
// DATABASE_URL. Keeping this check beside connection resolution prevents Worker requests from
// incorrectly taking the local no-database fallback just because DATABASE_URL is absent.
export function isDatabaseConfigured() {
  return Boolean(getHyperdriveConnectionString() ?? process.env.DATABASE_URL);
}

function resolveConnectionString() {
  const hyperdriveConnectionString = getHyperdriveConnectionString();
  if (hyperdriveConnectionString) return hyperdriveConnectionString;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to access content.");
  }

  return withExplicitSslMode(databaseUrl);
}

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: resolveConnectionString() }),
  });
}

export function getDb() {
  globalThis.madhuPrisma ??= createClient();
  return globalThis.madhuPrisma;
}
