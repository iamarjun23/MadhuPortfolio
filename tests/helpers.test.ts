import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getInstagramShortcode } from "@/lib/instagram";
import { getLinkedInUrn } from "@/lib/linkedin";
import { lockDurationMs, loginThrottleKeys } from "@/lib/login-throttle";
import { imageOrFallback } from "@/lib/placeholders";
import { refreshLiveSite } from "@/lib/revalidate";

test("login lockout starts at the fifth failure, doubles, and stops at an hour", () => {
  const minutes = [0, 4, 5, 6, 7, 11, 12, 30].map((n) => lockDurationMs(n) / 60_000);
  assert.deepEqual(minutes, [0, 0, 1, 2, 4, 60, 60, 60]);
});

test("login failures are counted per email and per client address", () => {
  const request = new Request("https://s.test/", {
    headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
  });
  assert.deepEqual(loginThrottleKeys("a@b.c", request), ["email:a@b.c", "ip:203.0.113.9"]);
  const real = new Request("https://s.test/", { headers: { "x-real-ip": "198.51.100.2" } });
  assert.deepEqual(loginThrottleKeys("a@b.c", real)[1], "ip:198.51.100.2");
});

test("LinkedIn and Instagram links resolve to the post they name, or to nothing", () => {
  const urn = "urn:li:activity:7320394390139502592";
  assert.equal(getLinkedInUrn(`https://www.linkedin.com/feed/update/${urn}/`), urn);
  assert.equal(
    getLinkedInUrn("https://www.linkedin.com/posts/jar_x-activity-7320394390139502592-Qx"),
    urn,
  );
  assert.equal(getLinkedInUrn("https://linkedin.evil.com/posts/x-activity-1-a"), null);
  assert.equal(getLinkedInUrn("https://www.linkedin.com/in/someone"), null);

  assert.equal(
    getInstagramShortcode("https://www.instagram.com/reel/DZoq0gPoYDd/?x=1"),
    "DZoq0gPoYDd",
  );
  assert.equal(
    getInstagramShortcode("https://instagram.com/madhu_on_run/reel/Abc_12-x/"),
    "Abc_12-x",
  );
  assert.equal(getInstagramShortcode("https://www.instagram.com/madhu_on_run"), null);
  assert.equal(getInstagramShortcode("https://instagram.com.evil.io/p/abc/"), null);
});

test("the site-wide stand-in never claims to be the slot's subject", () => {
  const standIn = { url: "https://media.example.com/fallbackImage/x.avif" };
  assert.deepEqual(imageOrFallback(null, standIn, "N Madhu Kumar"), { url: standIn.url, alt: "" });
  const own = { url: "https://media.example.com/portrait/y.avif", alt: "Madhu at the desk" };
  assert.deepEqual(imageOrFallback(own, standIn, "N Madhu Kumar"), own);
  assert.deepEqual(imageOrFallback({ url: "https://placehold.co/1", alt: "x" }, null, "a"), null);
});

const env = { ...process.env };
const realFetch = globalThis.fetch;
afterEach(() => {
  process.env = { ...env };
  globalThis.fetch = realFetch;
});

test("the live-site refresh reports failure instead of pretending", async () => {
  Reflect.deleteProperty(process.env, "PUBLIC_SITE_URL");
  Reflect.deleteProperty(process.env, "VERCEL");
  assert.equal(await refreshLiveSite(), true, "one server locally: nothing to clear");

  process.env.VERCEL = "1";
  assert.equal(await refreshLiveSite(), false, "misconfigured on Vercel");

  process.env.PUBLIC_SITE_URL = "https://site.test";
  process.env.REVALIDATE_SECRET = "s3cret";
  let sent: Headers | undefined;
  globalThis.fetch = async (_input, init) => {
    sent = new Headers(init?.headers);
    return new Response(null, { status: 401 });
  };
  assert.equal(await refreshLiveSite(), false, "a rejected secret");
  assert.equal(sent?.get("authorization"), "Bearer s3cret");

  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  assert.equal(await refreshLiveSite(), false, "an unreachable site");
});
