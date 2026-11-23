import assert from "node:assert/strict";
import { test } from "node:test";
import { sniffMimeType, verifiedMimeType } from "@/lib/file-signature";

const box = (size: number, name: string, rest = "") => {
  const bytes = new Uint8Array(32);
  new DataView(bytes.buffer).setUint32(0, size);
  bytes.set(new TextEncoder().encode(name + rest), 4);
  return bytes;
};

test("real MP4 and legacy QuickTime headers are recognised", () => {
  assert.equal(sniffMimeType(box(24, "ftyp", "isom"), 5_000_000), "video/mp4");
  assert.equal(sniffMimeType(box(20, "ftyp", "qt  "), 5_000_000), "video/quicktime");
  assert.equal(sniffMimeType(box(8, "wide"), 5_000_000), "video/quicktime");
  assert.equal(sniffMimeType(box(0, "mdat"), 5_000_000), "video/quicktime");
});

test("markup with an atom name in bytes 4-7 is refused", () => {
  const markup = new TextEncoder().encode("<!--free--><script>alert(1)</script>".padEnd(32));
  assert.equal(sniffMimeType(markup, 64 * 1024 * 1024), null);
  assert.equal(verifiedMimeType(markup, "video/quicktime", 64 * 1024 * 1024), null);
});

test("a box claiming to be larger than the file is refused", () => {
  assert.equal(sniffMimeType(box(10_000, "moov"), 9_000), null);
});
