import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchAllowed, readCappedBody, readHtmlPrefix, withThumbLimits } from "@/lib/thumb-proxy";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Serves `routes[url]` for each request and records the URLs asked for. */
function stubFetch(routes: Record<string, () => Response>) {
  const asked: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    asked.push(url);
    const route = routes[url];
    if (!route) throw new Error(`unexpected fetch ${url}`);
    return route();
  };
  return asked;
}

const redirect = (location: string) => () =>
  new Response(null, { status: 302, headers: { location } });
const ok = () => new Response("ok");
const isExample = (url: URL) => url.hostname.endsWith("example.com");

test("follows allowed https redirects by hand", async () => {
  const asked = stubFetch({
    "https://a.example.com/": redirect("https://b.example.com/"),
    "https://b.example.com/": ok,
  });
  const response = await fetchAllowed(new URL("https://a.example.com/"), isExample, {});
  assert.equal(response?.status, 200);
  assert.deepEqual(asked, ["https://a.example.com/", "https://b.example.com/"]);
});

test("refuses a redirect to another host or to plain http, without fetching it", async () => {
  const offHost = stubFetch({ "https://a.example.com/": redirect("https://169.254.169.254/") });
  assert.equal(await fetchAllowed(new URL("https://a.example.com/"), isExample, {}), null);
  assert.deepEqual(offHost, ["https://a.example.com/"]);

  stubFetch({ "https://a.example.com/": redirect("http://a.example.com/") });
  assert.equal(await fetchAllowed(new URL("https://a.example.com/"), isExample, {}), null);

  const first = stubFetch({});
  assert.equal(await fetchAllowed(new URL("http://a.example.com/"), isExample, {}), null);
  assert.deepEqual(first, [], "an http start is never fetched");
});

test("gives up after three redirects", async () => {
  stubFetch({
    "https://a.example.com/0": redirect("/1"),
    "https://a.example.com/1": redirect("/2"),
    "https://a.example.com/2": redirect("/3"),
    "https://a.example.com/3": redirect("/4"),
    "https://a.example.com/4": ok,
  });
  assert.equal(await fetchAllowed(new URL("https://a.example.com/0"), isExample, {}), null);
});

/** A body that arrives in `chunks` pieces of `size` bytes, with no Content-Length. */
function streamed(chunks: number, size: number, headers?: HeadersInit) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < chunks; i += 1) controller.enqueue(new Uint8Array(size).fill(65));
      controller.close();
    },
  });
  return new Response(stream, { headers });
}

test("reads at most 512KB of a page", async () => {
  const html = await readHtmlPrefix(streamed(10, 100 * 1024));
  assert.ok(html.length <= 512 * 1024);
  assert.ok(html.length >= 400 * 1024);
});

test("an image body is refused once it passes the cap, whatever the headers claim", async () => {
  assert.equal((await readCappedBody(streamed(3, 1000), 5000))?.length, 3000);
  assert.equal(await readCappedBody(streamed(6, 1000), 5000), null, "counted while streaming");
  assert.equal(
    await readCappedBody(streamed(6, 1000, { "content-length": "100" }), 5000),
    null,
    "a false Content-Length does not help",
  );
  assert.equal(
    await readCappedBody(streamed(1, 10, { "content-length": "9999" }), 5000),
    null,
    "a declared oversize body is refused up front",
  );
});

test("an over-long link is refused before any lookup", async () => {
  let looked = false;
  const request = new Request(`https://site.test/api/x?url=${"a".repeat(2049)}`);
  const response = await withThumbLimits(request, async () => {
    looked = true;
    return ok();
  });
  assert.equal(response.status, 414);
  assert.equal(looked, false);
});

test("at most six lookups run at once; the seventh is told to retry", async () => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  const request = () => new Request("https://site.test/api/x?url=https://example.com");
  const slow = Array.from({ length: 6 }, () =>
    withThumbLimits(request(), async () => {
      await held;
      return ok();
    }),
  );
  const seventh = await withThumbLimits(request(), async () => ok());
  assert.equal(seventh.status, 503);
  release();
  assert.deepEqual(
    (await Promise.all(slow)).map((r) => r.status),
    [200, 200, 200, 200, 200, 200],
  );
  assert.equal((await withThumbLimits(request(), async () => ok())).status, 200, "slots freed");
});
