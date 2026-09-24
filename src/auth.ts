import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db";
import {
  clearLoginFailures,
  isLoginLocked,
  loginThrottleKeys,
  recordLoginFailure,
} from "@/lib/login-throttle";
import { verifyPassword } from "@/lib/password";

// Surfaces on the login page as `?code=rate_limited`.
class LoginRateLimited extends CredentialsSignin {
  override code = "rate_limited";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const email =
          typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const keys = loginThrottleKeys(email, request);
        if (await isLoginLocked(keys)) throw new LoginRateLimited();

        const user = await getDb().user.findUnique({ where: { email } });
        if (
          !user?.password ||
          user.role !== "OWNER" ||
          !(await verifyPassword(password, user.password))
        ) {
          await recordLoginFailure(keys);
          return null;
        }
        await clearLoginFailures(keys);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});

export async function requireOwner() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorised");
  const user = await getDb().user.findUnique({ where: { email } });
  if (!user || user.role !== "OWNER") throw new Error("Unauthorised");
  return user;
}
