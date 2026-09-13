import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// On Vercel this deployment serves only the studio (see DEPLOYMENT.md), at the bare path instead
// of /studio, so /login, /api/*, Next's own assets, and old /studio links must NOT get re-prefixed.
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

  // Everything below needs a session lookup, which needs AUTH_SECRET - unset on the Worker, which
  // never serves /studio. Bailing out here before touching auth keeps every public/API request on
  // that deployment exactly as cheap and secret-free as before this file grew a catch-all matcher.
  if (!studioPathname.startsWith("/studio")) {
    return studioPathname !== externalPathname
      ? NextResponse.rewrite(new URL(studioPathname, nextUrl))
      : undefined;
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", externalPathname);
    return NextResponse.redirect(loginUrl);
  }

  if (studioPathname !== externalPathname) {
    return NextResponse.rewrite(new URL(studioPathname, nextUrl));
  }
}

// Next requires this matcher to be statically analyzable, so it can't branch on process.env.VERCEL
// like the logic above does — one pattern covers both deployments; the function body no-ops for
// every path the non-studio deployment doesn't care about, before it ever needs AUTH_SECRET.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
