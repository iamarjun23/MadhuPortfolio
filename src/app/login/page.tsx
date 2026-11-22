import { connection } from "next/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  // Rendered per request, not prerendered: on the Studio deployment the CSP carries a fresh
  // nonce each time (src/middleware.ts), and a page built ahead of time has no request to read
  // it from, so its scripts would be blocked. The Worker redirects /login before rendering.
  await connection();
  return (
    <main className="login-page">
      {/* The form reads `?error=` and `?callbackUrl=` with `useSearchParams`, which only resolves
          on the client, so that read needs a boundary to suspend behind. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
