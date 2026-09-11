import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { contentTag, publicPaths } from "@/lib/revalidate";
import { sectionKeys } from "@/lib/sections";

function isAuthorised(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("authorization");
  if (!secret || !given) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(given);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Called by the studio deployment after a publish - see `refreshLiveSite` in lib/revalidate.ts.
// Nothing renders here, so it stays well inside the Worker's CPU budget.
export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  for (const key of sectionKeys) revalidateTag(contentTag(key), { expire: 0 });
  for (const path of publicPaths) revalidatePath(path, "layout");
  return Response.json({ ok: true });
}
