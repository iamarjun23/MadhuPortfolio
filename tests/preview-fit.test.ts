import assert from "node:assert/strict";
import { test } from "node:test";
import { previewScale, wholeIsReadable } from "@/lib/preview-fit";

const pane = { width: 1000, height: 600 };

test("previewScale shrinks a tall section until all of it is in the pane", () => {
  assert.equal(previewScale(pane, { width: 1280, height: 2400 }, true), 0.25);
});

test("previewScale fits only the width when the pane is allowed to scroll", () => {
  assert.equal(previewScale(pane, { width: 1280, height: 2400 }, false), 1000 / 1280);
});

test("previewScale never enlarges a section that already fits", () => {
  assert.equal(previewScale(pane, { width: 800, height: 300 }, true), 1);
  assert.equal(previewScale(pane, { width: 800, height: 300 }, false), 1);
});

test("previewScale stays at 100% until there is something to measure", () => {
  assert.equal(previewScale(pane, { width: 1280, height: 0 }, true), 1);
  assert.equal(previewScale({ width: 0, height: 0 }, { width: 1280, height: 900 }, true), 1);
});

test("wholeIsReadable keeps a section whole only while that costs it little size", () => {
  // A full-screen scene: fitting its height barely shrinks it further.
  assert.equal(wholeIsReadable(pane, { width: 1280, height: 800 }), true);
  // A little taller, and the same scene would lose a fifth of its size: it scrolls.
  assert.equal(wholeIsReadable(pane, { width: 1280, height: 960 }), false);
  // A tall board: whole would be 25% against 78% by width, so it scrolls instead.
  assert.equal(wholeIsReadable(pane, { width: 1280, height: 2400 }), false);
  assert.equal(wholeIsReadable(pane, { width: 1280, height: 0 }), true);
});
