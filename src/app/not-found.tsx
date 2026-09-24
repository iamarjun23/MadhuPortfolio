import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

/* Any unmatched address and any notFound() call. It renders inside the root layout only (no
   nav, no database read), so the Worker serves it as a static page. */
export default function NotFound() {
  return (
    <main className="status-page wrap">
      <span className="slate">404</span>
      <h1>This page isn&rsquo;t here.</h1>
      <p>The link may be old or mistyped. Everything else is still on the home page.</p>
      <Link className="button button--primary" href="/">
        Back to the home page
      </Link>
    </main>
  );
}
