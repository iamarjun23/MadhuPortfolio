import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  // No `trustHost` override: Auth.js already trusts the host on Vercel, in local dev and whenever
  // AUTH_URL is set, and AUTH_URL (required for production builds, see next.config.mjs) pins every
  // sign-in URL to the studio's own origin so a forged Host header cannot redirect a callback.
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
