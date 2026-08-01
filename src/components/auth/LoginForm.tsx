"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    const result = await signIn("credentials", {
      redirect: false,
      email: formData.get("email"),
      password: formData.get("password"),
    });
    setPending(false);
    if (result?.error) {
      setError("Email or password is incorrect.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/studio");
    router.refresh();
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
