import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { cache } from "react";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db";
import {
  delayAfterFailure,
  loginThrottleKeys,
  recordLoginSuccess,
  reserveLoginAttempt,
} from "@/lib/login-throttle";
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/credential-limits";
import { hashPassword, needsRehash, verifyAgainstDummy, verifyPassword } from "@/lib/password";
import { SESSION_MAX_AGE_SECONDS, isLiveSession } from "@/lib/studio-sessions";

// Surfaces on the login page as `?code=rate_limited`.
class LoginRateLimited extends CredentialsSignin {
  override code = "rate_limited";
}

declare module "next-auth" {
  interface User {
    /** Set by `authorize` for the jwt callback only; never copied into the token. */
    verifiedPasswordHash?: string;
  }
}

async function findOwner(email: string) {
  const user = await getDb().user.findUnique({ where: { email } });
  return user?.role === "OWNER" ? user : null;
}

/** Creates the Session row, but only while the owner's stored password is still the hash the
    sign-in verified. A password change that commits while a sign-in with the old password is in
    flight has already deleted the rows that existed; without this check that sign-in would then
    add a fresh one. `FOR SHARE` makes this wait for a change that is mid-commit and then see its
    new hash, so there is no window between the check and the insert. Returns the token, or null. */
async function startSession(userId: string, verifiedHash: string) {
  const sessionToken = crypto.randomUUID();
  const started = await getDb().$transaction(async (tx) => {
    const current = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "User" WHERE "id" = ${userId} AND "password" = ${verifiedHash} FOR SHARE`;
    if (current.length === 0) return false;
    // Rows from earlier sign-ins that have expired go here, so the table never grows.
    await tx.session.deleteMany({ where: { expires: { lt: new Date() } } });
    await tx.session.create({
      data: {
        sessionToken,
        userId,
        expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
      },
    });
    return true;
  });
  return started ? sessionToken : null;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Each token is tied to a Session row (src/lib/studio-sessions.ts). Returning null clears
    // the cookie, so a token whose row was deleted by logout or a password change, or has
    // expired, stops working on the next request.
    async jwt({ token, user }) {
      const db = getDb();
      if (user?.email) {
        const owner = await findOwner(user.email);
        if (!owner || !user.verifiedPasswordHash) return null;
        const sessionToken = await startSession(owner.id, user.verifiedPasswordHash);
        return sessionToken ? { ...token, sessionToken } : null;
      }
      if (typeof token.sessionToken !== "string") return null;
      const row = await db.session.findUnique({
        where: { sessionToken: token.sessionToken },
        select: { expires: true, user: { select: { email: true, role: true } } },
      });
      return isLiveSession(row, token.email, new Date()) ? token : null;
    },
  },
  events: {
    // Logout ends this session server-side too: a copy of the cookie stops working with it.
    async signOut(message) {
      const sessionToken = "token" in message ? message.token?.sessionToken : undefined;
      if (typeof sessionToken === "string") {
        await getDb().session.deleteMany({ where: { sessionToken } });
      }
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const email =
          typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        // No real owner email or password is this long, so these never reach the database.
        if (!email || !password || email.length > MAX_EMAIL_LENGTH) return null;
        if (password.length > MAX_PASSWORD_LENGTH) return null;

        const keys = loginThrottleKeys(email, request.headers);
        const attempt = await reserveLoginAttempt(keys);
        if (!attempt.allowed) throw new LoginRateLimited();

        const user = await findOwner(email);
        if (!user?.password) await verifyAgainstDummy(password);
        if (!user?.password || !(await verifyPassword(password, user.password))) {
          await delayAfterFailure(attempt.attempts);
          return null;
        }
        await recordLoginSuccess(keys);
        // The plain password is only in hand here, so this is the one place an old hash can be
        // upgraded. It only writes while the stored hash is still the one just verified, so a
        // password change that commits meanwhile is never overwritten with the old password.
        let verifiedPasswordHash = user.password;
        if (needsRehash(user.password)) {
          const upgraded = await hashPassword(password);
          const { count } = await getDb().user.updateMany({
            where: { id: user.id, password: user.password },
            data: { password: upgraded },
          });
          if (count === 1) verifiedPasswordHash = upgraded;
        }
        return { id: user.id, email: user.email, name: user.name, verifiedPasswordHash };
      },
    }),
  ],
});

/** The signed-in owner, or null when there is no valid owner session. Cached per request, so
    the Studio layout and page checking it together cost one lookup. */
export const getOwner = cache(async () => {
  const session = await auth();
  const email = session?.user?.email;
  return email ? findOwner(email) : null;
});

/** For Studio pages: the owner, or a redirect to sign-in. Each page checks for itself because
    a layout's check does not stop the page beside it from loading its data. */
export async function requireOwnerOrSignIn() {
  const owner = await getOwner();
  if (!owner) redirect("/login");
  return owner;
}

export async function requireOwner() {
  const user = await getOwner();
  if (!user) throw new Error("Unauthorised");
  return user;
}
