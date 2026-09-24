import assert from "node:assert/strict";
import { test } from "node:test";
import { SIGNATURE_BYTES, sniffMimeType, verifiedMimeType } from "@/lib/file-signature";
import { parseListPage } from "@/lib/media-config";

const bytes = (...parts: (string | number[])[]) => {
  const out = new Uint8Array(SIGNATURE_BYTES);
  let offset = 0;
  for (const part of parts) {
    const values = typeof part === "string" ? [...part].map((c) => c.charCodeAt(0)) : part;
    out.set(values, offset);
    offset += values.length;
  }
  return out;
};

test("recognises each allowed format by its leading bytes", () => {
  assert.equal(sniffMimeType(bytes([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffMimeType(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(sniffMimeType(bytes("GIF89a")), "image/gif");
  assert.equal(sniffMimeType(bytes("RIFF", [0, 0, 0, 0], "WEBP")), "image/webp");
  assert.equal(sniffMimeType(bytes([0, 0, 0, 0x1c], "ftypavif")), "image/avif");
  assert.equal(sniffMimeType(bytes([0, 0, 0, 0x18], "ftypisom")), "video/mp4");
  assert.equal(sniffMimeType(bytes([0, 0, 0, 0x14], "ftypqt  ")), "video/quicktime");
  assert.equal(sniffMimeType(bytes([0, 0, 0, 0x08], "moov")), "video/quicktime");
  assert.equal(sniffMimeType(bytes([0x1a, 0x45, 0xdf, 0xa3])), "video/webm");
  assert.equal(sniffMimeType(bytes("%PDF-1.7")), "application/pdf");
});

test("markup posing as an image is refused", () => {
  assert.equal(verifiedMimeType(bytes("<!DOCTYPE html>"), "image/jpeg"), null);
  assert.equal(verifiedMimeType(bytes("<svg xmlns="), "image/png"), null);
  assert.equal(verifiedMimeType(bytes("%PDF-1.7"), "image/jpeg"), null, "wrong family");
});

test("an honest mislabel within one family is stored as its real type", () => {
  const png = bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(verifiedMimeType(png, "image/jpeg"), "image/png");
  assert.equal(
    verifiedMimeType(bytes([0, 0, 0, 0x18], "ftypisom"), "video/quicktime"),
    "video/mp4",
  );
});

test("parses a ListObjectsV2 page, skipping malformed entries", () => {
  const page = parseListPage(`<?xml version="1.0"?>
    <ListBucketResult>
      <IsTruncated>true</IsTruncated>
      <Contents><Key>portrait/a</Key><LastModified>2026-09-01T10:00:00.000Z</LastModified><Size>1234</Size></Contents>
      <Contents><Key>heroVideo/b</Key><LastModified>not a date</LastModified><Size>1</Size></Contents>
      <Contents><Key>hero-poster.avif</Key><LastModified>2026-09-02T10:00:00.000Z</LastModified><Size>96000</Size></Contents>
      <NextContinuationToken>abc==</NextContinuationToken>
    </ListBucketResult>`);
  assert.deepEqual(
    page.objects.map((o) => [o.key, o.bytes]),
    [
      ["portrait/a", 1234],
      ["hero-poster.avif", 96000],
    ],
  );
  assert.equal(page.nextToken, "abc==");
  assert.equal(parseListPage("<IsTruncated>false</IsTruncated>").nextToken, undefined);
});
