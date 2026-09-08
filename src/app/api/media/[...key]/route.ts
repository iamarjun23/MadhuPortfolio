import { getCloudflareContext } from "@opennextjs/cloudflare";

type RouteParams = Readonly<{ params: Promise<{ key: string[] }> }>;

// Cloning the response to populate the cache tees the R2 stream, and whichever half is
// read slower buffers in the Worker's memory. Only small objects are worth that risk
// against the 128MB limit; browsers request video with a Range header anyway, which
// takes the 206 path below and never reaches the cache at all.
const EDGE_CACHE_MAX_BYTES = 8 * 1024 * 1024;

// `caches.default` is a Workers-only member that the ambient DOM `CacheStorage` type
// (pulled in by tsconfig's "dom" lib) doesn't declare, and it is not reachable from every
// bundle this route ends up in — reading media 500'd on every non-Range request because
// the previous unchecked cast assumed it was always there. The edge cache is an
// optimisation, so treat it as absent unless it is genuinely usable.
function getEdgeCache(): Cache | undefined {
  const store = (caches as unknown as { default?: Cache }).default;
  return typeof store?.match === "function" && typeof store.put === "function" ? store : undefined;
}

function parseByteRange(value: string | null) {
  if (!value) return undefined;

  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!match) return undefined;

  const [, startValue, endValue] = match;
  if (!startValue && !endValue) return undefined;

  if (!startValue) {
    const suffix = Number(endValue);
    return Number.isSafeInteger(suffix) && suffix > 0 ? { suffix } : undefined;
  }

  const offset = Number(startValue);
  if (!Number.isSafeInteger(offset) || offset < 0) return undefined;
  if (!endValue) return { offset };

  const end = Number(endValue);
  if (!Number.isSafeInteger(end) || end < offset) return undefined;
  return { offset, length: end - offset + 1 };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  // Media keys are random UUIDs and never reused for different content, so full-response
  // caching at Cloudflare's edge is safe: a repeat view (or a second viewer) is served
  // straight from cache instead of re-streaming the object out of R2 through the Worker
  // each time, which is what made large videos feel slow to (re)load.
  const { env, ctx } = getCloudflareContext();
  const edgeCache = getEdgeCache();
  const range = request.headers.get("range");
  // Key on the URL alone. The request Next hands a route handler is rebuilt from the
  // incoming one and carries cookies and auth headers that have nothing to do with which
  // object is being served.
  const cacheKey = new Request(request.url, { method: "GET" });

  if (edgeCache && !range) {
    try {
      const cached = await edgeCache.match(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error(`Reading the edge cache for ${key} failed`, error);
    }
  }

  if (!env.MEDIA_BUCKET) {
    return new Response("Uploads are not configured.", { status: 503 });
  }

  const parsedRange = parseByteRange(range);
  const object = await env.MEDIA_BUCKET.get(key, parsedRange ? { range: parsedRange } : undefined);

  if (!object) {
    return new Response("Not found.", { status: 404 });
  }

  const headers = new Headers({
    "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
  });
  if (object.httpMetadata?.contentLanguage) {
    headers.set("content-language", object.httpMetadata.contentLanguage);
  }
  if (object.httpMetadata?.contentDisposition) {
    headers.set("content-disposition", object.httpMetadata.contentDisposition);
  }
  if (object.httpMetadata?.contentEncoding) {
    headers.set("content-encoding", object.httpMetadata.contentEncoding);
  }
  headers.set("etag", object.httpEtag);
  headers.set(
    "cache-control",
    object.httpMetadata?.cacheControl ?? "public, max-age=31536000, immutable",
  );
  headers.set("accept-ranges", "bytes");

  // R2 reports `object.range` on every read, a full one included, so the partial-content
  // branch has to key off what the client actually asked for. Answering an unconditional
  // GET with a 206 is what left photos blank: next/image refuses a partial upstream
  // response ("upstream response is invalid") while <video> happily accepts one, so video
  // played and every still image broke.
  if (parsedRange) {
    // R2 resolves whatever was asked for and reports it back, so read the answer off the
    // object rather than re-deriving it from the header.
    const resolved = object.range;
    const suffix = resolved && "suffix" in resolved ? resolved.suffix : undefined;
    const offset =
      resolved && "offset" in resolved && resolved.offset !== undefined ? resolved.offset : 0;
    const start = suffix === undefined ? offset : Math.max(0, object.size - suffix);
    const length =
      suffix !== undefined
        ? Math.min(suffix, object.size)
        : resolved && "length" in resolved && resolved.length !== undefined
          ? resolved.length
          : object.size - start;
    headers.set("content-range", `bytes ${start}-${start + length - 1}/${object.size}`);
    headers.set("content-length", String(length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  const response = new Response(object.body, { status: 200, headers });

  // Populate the edge cache in the background so this response isn't held up by it, and
  // so the *next* request for this key (from this viewer or another) is served from cache.
  if (edgeCache && object.size <= EDGE_CACHE_MAX_BYTES) {
    ctx.waitUntil(
      edgeCache
        .put(cacheKey, response.clone())
        .catch((error: unknown) =>
          console.error(`Populating the edge cache for ${key} failed`, error),
        ),
    );
  }

  return response;
}
