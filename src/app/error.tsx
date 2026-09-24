"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>;

/* Catches a failed render anywhere under the root layout, including the public layout's own
   content reads. In production a server error arrives with only a digest, which matches the
   entry in the server logs; the message itself is never shown. */
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error("Page failed to render", error);
  }, [error]);

  return (
    <main className="status-page wrap">
      <span className="slate">Something went wrong</span>
      <h1>This page didn&rsquo;t load.</h1>
      <p>It&rsquo;s usually temporary. Try again, or head back to the home page.</p>
      <div className="status-page__actions">
        <button className="button button--primary" type="button" onClick={() => retry()}>
          Try again
        </button>
        <Link className="button button--ghost" href="/">
          Home page
        </Link>
      </div>
      {error.digest ? <small>Reference: {error.digest}</small> : null}
    </main>
  );
}
