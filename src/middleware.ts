import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// On Vercel this deployment serves only the studio (see DEPLOYMENT.md), at the bare path instead
// of /studio, so /login, /api/*, Next's own assets, and old /studio links must NOT get re-prefixed.
//
// Kept as `middleware.ts` despite Next 16's deprecation warning: `proxy.ts` only runs on the Node.js
// runtime, and OpenNext's Cloudflare adapter marks Node.js middleware experimental and unmaintained.
// This file compiles to edge middleware, which the Worker build supports. Rename it once it does.
const STUDIO_PASSTHROUGH = ["/login", "/api", "/_next", "/favicon.ico", "/studio"];

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const externalPathname = nextUrl.pathname;
  const isPassthrough = STUDIO_PASSTHROUGH.some(
    (path) => externalPathname === path || externalPathname.startsWith(`${path}/`),
  );

  const studioPathname =
    process.env.VERCEL && !isPassthrough
      ? `/studio${externalPathname === "/" ? "" : externalPathname}`
      : externalPathname;
  // The query has to ride along: a Navbar or Footer tab is `/settings?open=...`, and a
  // rewrite to the bare path alone opens the whole settings editor instead of that part.
  const studioUrl = new URL(`${studioPathname}${nextUrl.search}`, nextUrl);

  // Everything below needs a session lookup, which needs AUTH_SECRET - unset on the Worker, which
  // never serves /studio. Bailing out here before touching auth keeps every public/API request on
  // that deployment exactly as cheap and secret-free as before this file grew a catch-all matcher.
  if (!studioPathname.startsWith("/studio")) {
    return studioPathname !== externalPathname
      ? NextResponse.rewrite(studioUrl)
      : undefined;
  }

  // Auth.js prefixes the session cookie with __Secure- over HTTPS; getToken assumes plain HTTP unless told.
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: nextUrl.protocol === "https:",
  });
  if (!token) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", externalPathname);
    return NextResponse.redirect(loginUrl);
  }

  if (studioPathname !== externalPathname) {
    return NextResponse.rewrite(studioUrl);
  }
}

// Next requires this matcher to be statically analyzable, so it can't branch on process.env.VERCEL
// like the logic above does — one pattern covers both deployments; the function body no-ops for
// every path the non-studio deployment doesn't care about, before it ever needs AUTH_SECRET.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
