import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` only reads the schema — it needs this url to be a well-formed string, not a
// live connection. Cloudflare Workers Builds runs `pnpm install` (which runs `prisma generate` via
// postinstall) before any runtime secrets/Hyperdrive binding exist, so DATABASE_URL isn't set at
// that point. Fall back to a placeholder rather than using `env()`, which throws when unset.
const datasourceUrl =
  process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/db?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
