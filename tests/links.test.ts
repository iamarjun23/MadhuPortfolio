import assert from "node:assert/strict";
import { test } from "node:test";

// media.ts reads the upload domain when it loads, so set it before importing.
process.env.NEXT_PUBLIC_MEDIA_URL = "https://media.example.com";
process.env.NEXT_PUBLIC_SITE_URL = "https://site.example.com";
const { ExternalLinkSchema, InternalLinkSchema, LinkSchema } = await import("@/schemas/links");
const { DocumentUrlSchema, ImageUrlSchema, VideoUrlSchema } = await import("@/schemas/media");
const { ContactSchema } = await import("@/schemas");

const accepts = (schema: { safeParse: (v: unknown) => { success: boolean } }, value: string) =>
  schema.safeParse(value).success;

test("external links are https only", () => {
  assert.ok(accepts(ExternalLinkSchema, "https://example.com/a"));
  for (const bad of ["http://example.com", "javascript:alert(1)", "data:text/html,x", "//x.com"]) {
    assert.equal(accepts(ExternalLinkSchema, bad), false, bad);
  }
});

test("internal links are a path or an anchor on this site", () => {
  for (const good of ["/room", "/", "#work", "/room?x=1#y"]) {
    assert.ok(accepts(InternalLinkSchema, good), good);
  }
  for (const bad of [
    "//evil.com",
    "/\\evil.com",
    "room",
    "https://x.com",
    "javascript:x",
    "/a b",
  ]) {
    assert.equal(accepts(InternalLinkSchema, bad), false, bad);
  }
});

test("a button link takes either kind, never a script", () => {
  assert.ok(accepts(LinkSchema, "/room"));
  assert.ok(accepts(LinkSchema, "https://example.com"));
  assert.equal(accepts(LinkSchema, "javascript:alert(1)"), false);
});

test("media addresses must be uploads or allow-listed hosts", () => {
  assert.ok(accepts(ImageUrlSchema, "https://media.example.com/portrait/a.avif"));
  assert.ok(accepts(ImageUrlSchema, "https://i.ytimg.com/vi/x/hqdefault.jpg"));
  assert.ok(accepts(VideoUrlSchema, "https://videos.pexels.com/x.mp4"));
  assert.ok(
    accepts(ImageUrlSchema, "/api/media/portrait/0b8f7c9e-1d2a-4f3b-9c8d-7e6f5a4b3c2d"),
    "legacy upload path",
  );

  assert.equal(accepts(ImageUrlSchema, "https://evil.example.org/a.png"), false);
  assert.equal(accepts(ImageUrlSchema, "http://media.example.com/a.png"), false);
  assert.equal(accepts(VideoUrlSchema, "https://i.ytimg.com/x.mp4"), false, "image host for video");
  assert.equal(accepts(DocumentUrlSchema, "https://images.pexels.com/cv.pdf"), false);
  assert.equal(
    accepts(ImageUrlSchema, "/api/media/unknownSlot/0b8f7c9e-1d2a-4f3b-9c8d-7e6f5a4b3c2d"),
    false,
  );
});

test("contact phone is empty or international with 8-15 digits", () => {
  const phone = (value: string) => ContactSchema.shape.phone.safeParse(value).success;
  for (const good of ["", "+91 98765 43210", "+1 (415) 555-0100", "+4420-7946-0958"]) {
    assert.ok(phone(good), good);
  }
  for (const bad of [
    "98765 43210",
    "+12 345",
    "+1234567890123456",
    "javascript:alert(1)",
    "+91abc",
  ]) {
    assert.equal(phone(bad), false, bad);
  }
});

test("footer WhatsApp number shares the phone rules and has a placeholder", () => {
  const whatsapp = ContactSchema.shape.socials.shape.whatsapp;
  // Missing becomes the placeholder, so the Studio form always has the field to render.
  assert.equal(whatsapp.parse(undefined), "+91 98765 43210");
  assert.equal(whatsapp.parse(""), "");
  assert.equal(whatsapp.safeParse("98765 43210").success, false);
});

test("only uploaded videos get a Cloudflare media transformation address", async () => {
  const { transformedVideoSrc } = await import("@/lib/media-src");
  assert.equal(
    transformedVideoSrc("https://media.example.com/heroVideo/abc", "mode=frame,time=0s"),
    "https://media.example.com/cdn-cgi/media/mode=frame,time=0s/heroVideo/abc",
  );
  assert.equal(transformedVideoSrc("https://videos.pexels.com/x.mp4", "mode=video"), null);
});

test("the image loader resizes uploads and our thumbnail routes, nothing else", async () => {
  const { default: loader } = await import("@/lib/image-loader");
  const thumb = "/api/linkedin-thumb?url=https%3A%2F%2Fwww.linkedin.com%2Fposts%2Fx";
  assert.equal(
    loader({ src: thumb, width: 384 }),
    `https://media.example.com/cdn-cgi/image/width=384,quality=90,format=auto/https://site.example.com${thumb}`,
  );
  assert.equal(
    loader({ src: "https://media.example.com/reelCover/a", width: 256 }),
    "https://media.example.com/cdn-cgi/image/width=256,quality=90,format=auto/reelCover/a",
  );
  const youtube = "https://i.ytimg.com/vi/x/hqdefault.jpg";
  assert.equal(loader({ src: youtube, width: 384 }), youtube);
  assert.equal(loader({ src: "/api/other?x=1", width: 384 }), "/api/other?x=1");
});
