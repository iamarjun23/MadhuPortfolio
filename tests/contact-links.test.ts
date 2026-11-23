import assert from "node:assert/strict";
import { test } from "node:test";
import {
  callbackHref,
  cityOf,
  isTimeZone,
  profilePath,
  telHref,
  whatsAppHref,
} from "@/lib/contact-links";

test("WhatsApp and tel links keep only what the scheme accepts", () => {
  assert.equal(whatsAppHref("+91 98765 43210"), "https://wa.me/919876543210");
  assert.equal(whatsAppHref(""), null);
  assert.equal(telHref("+91 (98765) 43210"), "tel:+919876543210");
});

test("the callback email carries a subject and a fill-in body", () => {
  const url = new URL(callbackHref("hi@example.com"));
  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, "hi@example.com");
  assert.equal(url.searchParams.get("subject"), "Callback request");
  assert.equal(url.searchParams.get("body"), "Name:\nPhone:\nBest time to call:");
});

test("profile links show their path and locations show their city", () => {
  assert.equal(profilePath("https://www.linkedin.com/in/nmadhukumar/"), "/in/nmadhukumar");
  assert.equal(profilePath("https://example.com"), "https://example.com");
  assert.equal(cityOf("Bengaluru, Karnataka, India"), "Bengaluru");
  assert.equal(cityOf("Chennai"), "Chennai");
});

test("only real time zones pass", () => {
  assert.ok(isTimeZone("Asia/Kolkata"));
  assert.equal(isTimeZone("Mars/Olympus"), false);
});
