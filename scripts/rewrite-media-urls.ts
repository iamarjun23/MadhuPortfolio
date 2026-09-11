import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma-node/client";

/* One-off: points every upload stored as `/api/media/<key>` - or hand-typed as
   `https://<site>/api/media/<key>` - at R2's custom domain, in the media rows and
   in every section's JSON (drafts and published), then asks the live site to drop
   its cached pages. Safe to re-run: rewritten values no longer match. */

const databaseUrl = process.env.DATABASE_URL;
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;
if (!databaseUrl || !mediaUrl) {
  throw new Error("DATABASE_URL and NEXT_PUBLIC_MEDIA_URL are required.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const [mediaRows, sectionRows] = await db.$transaction([
  db.$executeRaw`UPDATE "Media" SET url = ${`${mediaUrl}/`}::text || key WHERE url LIKE '%/api/media/%'`,
  db.$executeRaw`
    UPDATE "Section"
    SET data = regexp_replace(data::text, '"(https?://[^"/]*)?/api/media/', ${`"${mediaUrl}/`}::text, 'g')::jsonb
    WHERE data::text LIKE '%/api/media/%'
  `,
]);
await db.$disconnect();
console.info(`Rewrote ${mediaRows} media rows and ${sectionRows} sections.`);

const siteUrl = process.env.PUBLIC_SITE_URL;
if (siteUrl) {
  const response = await fetch(new URL("/api/revalidate", siteUrl), {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}` },
  });
  if (!response.ok) throw new Error(`Refreshing the live site answered ${response.status}.`);
  console.info("Live site cache cleared.");
} else {
  console.info("PUBLIC_SITE_URL unset: clear the live site's cache by publishing from the studio.");
}
