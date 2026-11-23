import assert from "node:assert/strict";
import { test } from "node:test";
import { sketchbookPages } from "@/lib/sketchbook-pages";

const types = (pages: { type: string }[][]) => pages.map((page) => page.map((card) => card.type));

test("a page holds two pictures and at most three cards, in board order", () => {
  const cards = [
    "polaroid",
    "note",
    "video",
    "ig",
    "note",
    "quote",
    "tags",
    "polaroid",
    "video",
    "polaroid",
  ].map((type) => ({ type }));
  assert.deepEqual(types(sketchbookPages(cards)), [
    ["polaroid", "note", "video"],
    ["ig", "note", "quote"],
    ["tags", "polaroid", "video"],
    ["polaroid"],
  ]);
});

test("no cards make no pages", () => {
  assert.deepEqual(sketchbookPages([]), []);
});
