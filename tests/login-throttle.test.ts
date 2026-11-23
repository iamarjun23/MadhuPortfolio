import assert from "node:assert/strict";
import { test } from "node:test";
import { loginThrottleKeys } from "@/lib/login-throttle";

test("keys use the real client IP and mark it as a trustable address", () => {
  const keys = loginThrottleKeys("owner@example.test", new Headers({ "x-real-ip": "203.0.113.7" }));
  assert.deepEqual(keys, {
    ipKey: "ip:203.0.113.7",
    emailKey: "email:owner@example.test",
    trustedKey: "trusted:owner@example.test|203.0.113.7",
  });
});

test("falls back to the first x-forwarded-for hop", () => {
  const keys = loginThrottleKeys(
    "a@b.test",
    new Headers({ "x-forwarded-for": "198.51.100.2, 10.0.0.1" }),
  );
  assert.equal(keys.ipKey, "ip:198.51.100.2");
});

test("an unknown address can never become trusted, so it cannot bypass the email lock", () => {
  const keys = loginThrottleKeys("owner@example.test", new Headers());
  assert.equal(keys.ipKey, "ip:unknown");
  assert.equal(keys.trustedKey, null);
});
