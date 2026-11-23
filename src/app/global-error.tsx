"use client";

import { useEffect } from "react";

type GlobalErrorProps = Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>;

/* Last resort for a crash in the root layout itself, where `error.tsx` cannot render. It replaces
   the layout, so it brings its own document and cannot use the site's stylesheet. */
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Root layout failed to render", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <main>
          <h1>This page didn&rsquo;t load.</h1>
          <p>It&rsquo;s usually temporary. Try again in a moment.</p>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
          {error.digest ? <p>Reference: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}
