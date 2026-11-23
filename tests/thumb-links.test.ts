import assert from "node:assert/strict";
import { test } from "node:test";
import { getInstagramThumbnail } from "@/lib/instagram";
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
