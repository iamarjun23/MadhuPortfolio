"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { studioHome } from "@/lib/studio-nav";
import StudioLoading from "@/app/studio/loading";

function getSafeRedirect(callbackUrl: string | null) {
  if (!callbackUrl) return studioHome;

  try {
    const target = new URL(callbackUrl, window.location.origin);
    if (target.origin !== window.location.origin) return studioHome;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return studioHome;
  }
}

export function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState(() => {
    const authError = params.get("error");
    if (params.get("code") === "rate_limited")
      return "Too many failed attempts. Wait a few minutes, then try again.";
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
  // signIn hard-navigates to the studio, whose layout blocks on auth + shell data, so the
  // login page stays on screen for the whole round trip. Swap in the studio skeleton at
  // click time; it remains until the studio (or the ?error= reload) paints.
  if (pending) {
    return (
      <div style={{ width: "min(100%, 72rem)" }}>
        <StudioLoading />
      </div>
    );
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
