import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { studioContentSecurityPolicy } from "@/lib/studio-csp";

// On Vercel this deployment serves only the studio (see DEPLOYMENT.md), at the bare path instead
// of /studio, so /login, /api/*, Next's own assets, and old /studio links must NOT get re-prefixed.
//
// Kept as `middleware.ts` despite Next 16's deprecation warning: `proxy.ts` only runs on the Node.js
// runtime, and OpenNext's Cloudflare adapter marks Node.js middleware experimental and unmaintained.
// This file compiles to edge middleware, which the Worker build supports. Rename it once it does.
const STUDIO_PASSTHROUGH = ["/login", "/api", "/_next", "/favicon.ico", "/studio"];

/* On the Studio deployment every page gets a fresh nonce and a CSP that allows only scripts
   carrying it (src/lib/studio-csp.ts). The policy goes on the request too: that is where
   Next.js reads the nonce from to stamp its own scripts. API responses and Next's assets are
   not documents and are left alone, as is every request on the Worker. */
function continueRequest(req: NextRequest, rewriteTo?: URL) {
  const { pathname } = req.nextUrl;
  const isDocument = !pathname.startsWith("/api/") && !pathname.startsWith("/_next/");
  if (!process.env.VERCEL || !isDocument) {
    return rewriteTo ? NextResponse.rewrite(rewriteTo) : undefined;
  }

  const nonce = btoa(crypto.randomUUID());
  const policy = studioContentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  const headers = new Headers(req.headers);
  headers.set("content-security-policy", policy);
  const init = { request: { headers } };
  const response = rewriteTo ? NextResponse.rewrite(rewriteTo, init) : NextResponse.next(init);
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

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
  const rewriteTo = studioPathname !== externalPathname ? studioUrl : undefined;

  // Everything below needs a session lookup, which needs AUTH_SECRET - unset on the Worker, which
  // never serves /studio. Bailing out here before touching auth keeps every public/API request on
  // that deployment exactly as cheap and secret-free as before this file grew a catch-all matcher.
  if (!studioPathname.startsWith("/studio")) return continueRequest(req, rewriteTo);

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

  return continueRequest(req, rewriteTo);
}

// Next requires this matcher to be statically analyzable, so it can't branch on process.env.VERCEL
// like the logic above does — one pattern covers both deployments; the function body no-ops for
// every path the non-studio deployment doesn't care about, before it ever needs AUTH_SECRET.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
