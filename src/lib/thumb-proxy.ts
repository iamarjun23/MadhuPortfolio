import { getCloudflareContext } from "@opennextjs/cloudflare";

/* The LinkedIn and Instagram thumbnail routes are public and each request makes the
   Worker fetch two remote resources, so without a ceiling anyone could use them to burn
   the Worker's CPU and request quota. Three limits sit in front of both routes. */

// A real post link is well under 300 characters.
const MAX_TARGET_URL_LENGTH = 2048;
// ponytail: counted per Worker isolate, not globally. The per-IP rate limit is the real guard;
// this only stops one isolate from holding a pile-up of slow upstream fetches at once.
const MAX_IN_FLIGHT = 6;
let inFlight = 0;

async function withinRateLimit(request: Request) {
  let limiter: RateLimit | undefined;
  try {
    limiter = getCloudflareContext().env.THUMB_RATE_LIMITER;
  } catch {
    // Not inside a Worker request (e.g. `next start`); nothing to rate limit with.
    return true;
  }
  if (!limiter) return true;
  const key = request.headers.get("cf-connecting-ip") ?? "unknown";
  return (await limiter.limit({ key })).success;
}

/** Runs `lookup` only if the request passes the size, per-IP rate and concurrency limits. */
export async function withThumbLimits(request: Request, lookup: () => Promise<Response>) {
  const target = new URL(request.url).searchParams.get("url") ?? "";
  if (target.length > MAX_TARGET_URL_LENGTH) {
    return new Response("Link too long.", { status: 414 });
  }
  if (!(await withinRateLimit(request))) {
    return new Response("Too many requests.", { status: 429, headers: { "retry-after": "60" } });
  }
  if (inFlight >= MAX_IN_FLIGHT) {
    return new Response("Busy, try again shortly.", {
      status: 503,
      headers: { "retry-after": "5" },
    });
  }

  inFlight += 1;
  try {
    return await lookup();
  } finally {
    inFlight -= 1;
  }
}

const MAX_REDIRECTS = 3;

/** Fetches `url`, following at most three redirects by hand. Every address along the way,
    the first included, must be https and pass `isAllowed`; otherwise this resolves to null.
    `redirect: "follow"` would let the upstream send the Worker anywhere, internal or not. */
export async function fetchAllowed(
  url: URL,
  isAllowed: (url: URL) => boolean,
  init: RequestInit,
): Promise<Response | null> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (current.protocol !== "https:" || !isAllowed(current)) return null;
    const response = await fetch(current, { ...init, redirect: "manual" });
    if (response.status < 300 || response.status > 399) return response;

    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location) return null;
    current = new URL(location, current);
  }
  return null;
}

/* Both helpers count the bytes actually received. `Content-Length` is only the
   upstream's claim: it can be missing, or wrong, and a body can run on past it. */

async function readUpTo(body: ReadableStream<Uint8Array>, maxBytes: number) {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let overflow = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (size + value.byteLength > maxBytes) {
      overflow = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    size += value.byteLength;
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes, overflow };
}

// Real post and embed pages run 100-270KB, with the tags we look for inside the first 32KB.
const MAX_HTML_BYTES = 512 * 1024;

/** The page's first 512KB as text; anything past that is never downloaded. */
export async function readHtmlPrefix(response: Response) {
  if (!response.body) return "";
  const { bytes } = await readUpTo(response.body, MAX_HTML_BYTES);
  return new TextDecoder().decode(bytes);
}

/** The whole body, or null as soon as it passes `maxBytes`. */
export async function readCappedBody(response: Response, maxBytes: number) {
  if (!response.body || Number(response.headers.get("content-length") ?? 0) > maxBytes) {
    await response.body?.cancel();
    return null;
  }
  const { bytes, overflow } = await readUpTo(response.body, maxBytes);
  return overflow ? null : bytes;
}
