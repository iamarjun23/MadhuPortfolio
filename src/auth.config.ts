import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  // Cloudflare terminates TLS and forwards requests to the Worker. Trust the host it supplies so
  // Auth.js can complete same-origin Studio sign-in callbacks on the deployed custom domain.
  trustHost: true,
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
