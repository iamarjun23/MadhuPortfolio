import { getCloudflareContext } from "@opennextjs/cloudflare";

type RouteParams = Readonly<{ params: Promise<{ key: string[] }> }>;

export async function GET(request: Request, { params }: RouteParams) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  const { env } = getCloudflareContext();
  if (!env.MEDIA_BUCKET) {
    return new Response("Uploads are not configured.", { status: 503 });
  }

  const rangeHeader = request.headers.get("range") ?? undefined;
  const object = await env.MEDIA_BUCKET.get(key, rangeHeader ? { range: request.headers } : undefined);

  if (!object) {
    return new Response("Not found.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("accept-ranges", "bytes");

  if (object.range && "offset" in object.range) {
    const start = object.range.offset ?? 0;
    const length = object.range.length ?? object.size - start;
    headers.set("content-range", `bytes ${start}-${start + length - 1}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { status: 200, headers });
}
