import assert from "node:assert/strict";
import { test } from "node:test";
import { encode } from "next-auth/jwt";
import { NextRequest } from "next/server";
import middleware from "@/middleware";

test("the studio host's rewrite keeps the query, so a tab's ?open= reaches the editor", async () => {
  process.env.VERCEL = "1";
  process.env.AUTH_SECRET = "test-only-secret-test-only-secret";
  const cookie = "authjs.session-token";
  const token = await encode({
    token: { sub: "owner" },
    secret: process.env.AUTH_SECRET,
    salt: cookie,
  });

  const response = await middleware(
    new NextRequest("http://studio.test/settings?open=site.navigation", {
      headers: { cookie: `${cookie}=${token}` },
    }),
  );

  assert.equal(
    response?.headers.get("x-middleware-rewrite"),
    "http://studio.test/studio/settings?open=site.navigation",
  );
});

test("studio pages get a fresh nonce-only script policy, passed to Next.js on the request", async () => {
  process.env.VERCEL = "1";
  const first = await middleware(new NextRequest("http://studio.test/login"));
  const second = await middleware(new NextRequest("http://studio.test/login"));
  const policy = first?.headers.get("content-security-policy") ?? "";
  const scriptSrc =
    policy.split("; ").find((directive) => directive.startsWith("script-src")) ?? "";

  assert.match(scriptSrc, /'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  assert.doesNotMatch(scriptSrc, /unsafe-inline/);
  assert.notEqual(policy, second?.headers.get("content-security-policy"));
  // Next.js reads the nonce from the forwarded request header.
  assert.equal(first?.headers.get("x-middleware-request-content-security-policy"), policy);
});

test("API routes and the Worker deployment get no per-request policy", async () => {
  process.env.VERCEL = "1";
  assert.equal(await middleware(new NextRequest("http://studio.test/api/ping")), undefined);
  delete process.env.VERCEL;
  assert.equal(await middleware(new NextRequest("http://site.test/room")), undefined);
});
