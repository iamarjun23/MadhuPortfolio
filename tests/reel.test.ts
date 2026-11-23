import assert from "node:assert/strict";
import { test } from "node:test";
import { reelThumbnail, resolveReel } from "@/lib/reel";

const cover = "https://media.example.com/reelCover/cover";
const href = "https://www.youtube.com/watch?v=5yyySPzTW-E";
const youTubeStill = "https://i.ytimg.com/vi/5yyySPzTW-E/hqdefault.jpg";

test("a cover that fails to load steps aside for the automatic still", () => {
  const reel = resolveReel({ href, image: { url: cover } });
  assert.equal(reelThumbnail(reel, new Set()), cover);
  assert.equal(reelThumbnail(reel, new Set([cover])), youTubeStill);
  assert.equal(reelThumbnail(reel, new Set([cover, youTubeStill])), null);
});

test("an upload with no still has no thumbnail, leaving the card to show its file", () => {
  const reel = resolveReel({ video: { url: "https://media.example.com/reelVideo/clip" } });
  assert.equal(reelThumbnail(reel, new Set()), null);
  assert.equal(reel.file, "https://media.example.com/reelVideo/clip");
});
