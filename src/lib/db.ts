import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { PrismaClient } from "@/generated/prisma/client";

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
  if (hyperdriveConnectionString) return withExplicitSslMode(hyperdriveConnectionString);

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to access content.");
  }

  return withExplicitSslMode(databaseUrl);
}

function createClient() {
  return new PrismaClient({
    // Hyperdrive is the pool. It holds the real PostgreSQL connections on Cloudflare's side and
    // hands the Worker a proxied one, so retiring the client's connection after a single use
    // (`maxUses: 1`, which this used to set) bought no safety and cost a TLS handshake on every
    // query — CPU billed against a per-invocation budget measured in milliseconds. The client
    // itself is still per-request: `getDb` is wrapped in React's `cache` below, so nothing here
    // leaks across request contexts, which is the constraint the Workers runtime actually imposes.
    adapter: new PrismaPg({ connectionString: resolveConnectionString() }),
  });
}

// React's request cache shares one client between Server Components rendered
// for the same request without retaining it in the Worker global scope.
export const getDb = cache(createClient);
