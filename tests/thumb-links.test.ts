import assert from "node:assert/strict";
import { test } from "node:test";
import { findEmbeddedMediaImage, getInstagramThumbnail } from "@/lib/instagram";
import { getLinkedInThumbnail } from "@/lib/linkedin";

test("every spelling of one LinkedIn post shares one thumbnail address", () => {
  const canonical = getLinkedInThumbnail(
    "https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/",
  );
  assert.equal(
    getLinkedInThumbnail(
      "https://www.linkedin.com/posts/someone_slug-activity-7123456789012345678-AbCd?utm_source=x",
    ),
    canonical,
  );
  assert.ok(canonical?.startsWith("/api/linkedin-thumb?url="));
});

test("reel, profile and query-string Instagram links share one thumbnail address", () => {
  const canonical = getInstagramThumbnail("https://www.instagram.com/p/C0deAbC123/");
  assert.equal(
    getInstagramThumbnail("https://www.instagram.com/someone/reel/C0deAbC123/?igsh=x"),
    canonical,
  );
  assert.equal(getInstagramThumbnail("https://instagram.com/reels/C0deAbC123"), canonical);
});

test("the Instagram embed's poster is found even when its srcset runs past 4KB", () => {
  const srcset = Array.from(
    { length: 40 },
    (_, i) => `https://x.fbcdn.net/${"a".repeat(200)}${i}.jpg ${i}w`,
  ).join(",");
  const html = `<img class="EmbeddedMediaImage" alt="caption src='https://evil/'" src="https://x.fbcdn.net/poster.jpg?a=1&amp;b=2" srcset="${srcset}">`;
  assert.equal(findEmbeddedMediaImage(html), "https://x.fbcdn.net/poster.jpg?a=1&amp;b=2");
});
