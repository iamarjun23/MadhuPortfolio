import { getCloudflareContext } from "@opennextjs/cloudflare";

type RouteParams = Readonly<{ params: Promise<{ key: string[] }> }>;

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

  const { env } = getCloudflareContext();
  if (!env.MEDIA_BUCKET) {
    return new Response("Uploads are not configured.", { status: 503 });
  }

  const range = parseByteRange(request.headers.get("range"));
  const object = await env.MEDIA_BUCKET.get(key, range ? { range } : undefined);

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

  if (object.range && "offset" in object.range) {
    const start = object.range.offset ?? 0;
    const length = object.range.length ?? object.size - start;
    headers.set("content-range", `bytes ${start}-${start + length - 1}/${object.size}`);
    headers.set("content-length", String(length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  return new Response(object.body, { status: 200, headers });
}
