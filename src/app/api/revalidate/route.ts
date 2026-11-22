import { revalidatePath, revalidateTag } from "next/cache";
import { contentTag, hasRevalidateSecret, publicPaths } from "@/lib/revalidate";
import { sectionKeys } from "@/lib/sections";

// Called by the studio deployment after a publish - see `refreshLiveSite` in lib/revalidate.ts.
// Nothing renders here, so it stays well inside the Worker's CPU budget.
export async function POST(request: Request) {
  if (!hasRevalidateSecret(request)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  for (const key of sectionKeys) revalidateTag(contentTag(key), { expire: 0 });
  for (const path of publicPaths) revalidatePath(path, "layout");
  return Response.json({ ok: true });
}

// Used by the studio's /api/health: confirms the secret matches without clearing anything.
export function GET(request: Request) {
  return new Response(null, {
    status: hasRevalidateSecret(request) ? 204 : 401,
    headers: { "cache-control": "no-store" },
  });
}
