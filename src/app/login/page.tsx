import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="login-page">
      {/* The form reads `?error=` and `?callbackUrl=` with `useSearchParams`, which only resolves
          on the client. Now that this page prerenders — nothing in the tree reads cookies on the
          server any more — that read needs a boundary to suspend behind. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
