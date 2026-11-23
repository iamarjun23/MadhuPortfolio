import assert from "node:assert/strict";
import { test } from "node:test";
import { pagerState } from "@/lib/scroll-pager";
import { DESIGN_WIDTH, PHONE_MAX_WIDTH, siteScale } from "@/lib/site-scale";
import { HeroSchema } from "@/schemas/hero";
import { RoomSchema } from "@/schemas/room";

test("siteScale shrinks the desktop layout below the design width", () => {
  assert.equal(siteScale(1600, DESIGN_WIDTH, PHONE_MAX_WIDTH), 1);
  assert.equal(siteScale(800, DESIGN_WIDTH, PHONE_MAX_WIDTH), 0.625);
});

test("siteScale leaves a phone-width window at full size on a page with a phone layout", () => {
  assert.equal(siteScale(390, DESIGN_WIDTH, PHONE_MAX_WIDTH), 1);
  assert.equal(siteScale(640, DESIGN_WIDTH, PHONE_MAX_WIDTH), 1);
  assert.equal(siteScale(641, DESIGN_WIDTH, PHONE_MAX_WIDTH), 641 / 1280);
});

test("siteScale still shrinks a phone-width window on a page without a phone layout", () => {
  assert.equal(siteScale(390, DESIGN_WIDTH, 0), 390 / 1280);
});

test("siteScale works from its own source, as the public layout inlines it", () => {
  const inlined = new Function(`return (${siteScale.toString()})(390, 1280, 640)`);
  assert.equal(inlined(), 1);
});

test("pagerState counts pages of one scroller width plus the gap between them", () => {
  // Five pages of 350px with a 12px gap between each: 5 * 350 + 4 * 12.
  const scrollWidth = 1798;
  assert.deepEqual(pagerState(0, 350, scrollWidth, 12), { page: 0, pages: 5 });
  assert.deepEqual(pagerState(362, 350, scrollWidth, 12), { page: 1, pages: 5 });
  assert.deepEqual(pagerState(1448, 350, scrollWidth, 12), { page: 4, pages: 5 });
});

test("pagerState settles on the nearer page mid-swipe and never leaves the range", () => {
  assert.equal(pagerState(170, 350, 1798, 12).page, 0);
  assert.equal(pagerState(200, 350, 1798, 12).page, 1);
  assert.equal(pagerState(9999, 350, 1798, 12).page, 4);
  assert.equal(pagerState(-40, 350, 1798, 12).page, 0);
});

test("pagerState reports a single page for a list that does not scroll, or is not laid out", () => {
  assert.deepEqual(pagerState(0, 350, 350), { page: 0, pages: 1 });
  assert.deepEqual(pagerState(0, 0, 0), { page: 0, pages: 1 });
});

test("the hero's phone video is optional and defaults to none", () => {
  const hero = HeroSchema.parse({
    eyebrow: "",
    line1: "Every frame",
    line2: "holds.",
    cutWords: ["a story"],
    sub: "",
    primaryCta: { label: "See the work", href: "#work" },
    secondaryCta: { label: "Enter", href: "/room" },
    bgVideo: { url: "https://example.com/reel.mp4" },
  });
  assert.equal(hero.bgVideoMobile, null);
});

test("the room entrance's phone photo is optional and defaults to none", () => {
  const stored = { ...RoomSchema.parse({ intro: "", cards: [] }).teaser, imageMobile: undefined };
  assert.equal(RoomSchema.parse({ intro: "", cards: [], teaser: stored }).teaser.imageMobile, null);
});
