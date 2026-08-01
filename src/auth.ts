import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const user = await getDb().user.findUnique({ where: { email } });
        if (!user?.password || user.role !== "OWNER" || !(await compare(password, user.password)))
          return null;
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
