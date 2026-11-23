import assert from "node:assert/strict";
import { test } from "node:test";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

test("reads the id from every common YouTube address", () => {
  assert.equal(getYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(getYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=3"), "dQw4w9WgXcQ");
  assert.equal(getYouTubeId("https://m.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(getYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

test("anything that is not an 11-character id is refused, not put in a URL path", () => {
  assert.equal(getYouTubeId("https://www.youtube.com/watch?v=../../evil"), null);
  assert.equal(getYouTubeId("https://youtu.be/abc"), null);
  assert.equal(getYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ%3Fx"), null);
  assert.equal(getYouTubeThumbnail("https://youtu.be/..%2F..%2Fx"), null);
  assert.equal(getYouTubeId("https://example.com/watch?v=dQw4w9WgXcQ"), null);
});
