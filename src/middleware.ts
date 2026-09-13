import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// On Vercel this deployment serves only the studio (see DEPLOYMENT.md), at the bare path instead
// of /studio, so /login, /api/*, Next's own assets, and old /studio links must NOT get re-prefixed.
const STUDIO_PASSTHROUGH = ["/login", "/api", "/_next", "/favicon.ico", "/studio"];

export default auth((req) => {
  const { nextUrl } = req;
  const externalPathname = nextUrl.pathname;
  const isPassthrough = STUDIO_PASSTHROUGH.some(
    (path) => externalPathname === path || externalPathname.startsWith(`${path}/`),
  );

  const studioPathname =
    process.env.VERCEL && !isPassthrough
      ? `/studio${externalPathname === "/" ? "" : externalPathname}`
      : externalPathname;

  if (studioPathname.startsWith("/studio") && !req.auth) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", externalPathname);
    return NextResponse.redirect(loginUrl);
  }

  if (studioPathname !== externalPathname) {
    return NextResponse.rewrite(new URL(studioPathname, nextUrl));
  }
});

// Next requires this matcher to be statically analyzable, so it can't branch on process.env.VERCEL
// like the logic above does — one pattern covers both deployments; the function body no-ops for
// every path the non-studio deployment doesn't care about.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
