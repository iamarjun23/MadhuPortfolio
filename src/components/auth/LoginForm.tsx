"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function getSafeRedirect(callbackUrl: string | null) {
  if (!callbackUrl) return "/studio";

  try {
    const target = new URL(callbackUrl, window.location.origin);
    if (target.origin !== window.location.origin) return "/studio";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/studio";
  }
}

export function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState(() => {
    const authError = params.get("error");
    if (authError === "CredentialsSignin") return "Email or password is incorrect.";
    return authError ? "Sign-in could not be completed. Please try again." : "";
  });
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    setError("");

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: getSafeRedirect(params.get("callbackUrl")),
      });
    } catch {
      setPending(false);
      setError("Sign-in could not be completed. Please try again.");
    }
  }
  return (
    <form className="login-form" action={submit}>
      <span className="slate">Studio access</span>
      <h1>Welcome back.</h1>
      <p>Sign in to edit madhu.edit.</p>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button className="button button--primary" type="submit" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
