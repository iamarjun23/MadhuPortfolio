import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import { isUploadEndpoint, uploadEndpoints } from "@/lib/media-upload";

type RouteParams = Readonly<{ params: Promise<{ endpoint: string }> }>;

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireOwner();
  } catch {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { endpoint } = await params;
  if (!isUploadEndpoint(endpoint)) {
    return NextResponse.json({ error: "Unknown upload endpoint" }, { status: 400 });
  }

  const config = uploadEndpoints[endpoint];
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith(config.accept)) {
    return NextResponse.json({ error: `Expected a ${config.accept}* file.` }, { status: 400 });
  }

  const declaredContentLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredContentLength > config.maxBytes) {
    return NextResponse.json(
      { error: `File must be under ${Math.round(config.maxBytes / (1024 * 1024))}MB.` },
      { status: 413 },
    );
  }

  const { env } = getCloudflareContext();
  if (!env.MEDIA_BUCKET) {
    return NextResponse.json({ error: "Uploads are not configured." }, { status: 503 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "Missing file body." }, { status: 400 });
  }

  // Stream the request body straight through to R2 instead of buffering the whole file
  // in the Worker's heap first. Buffering a full-size video (up to 64MB) alongside the
  // rest of the request/render work risked exceeding the Worker's 128MB memory limit.
  // Piping the incoming request body through a hand-rolled TransformStream broke on
  // Cloudflare (opaque 500s even for small files), so the byte cap is enforced by
  // checking R2's own reported size after the write instead of counting chunks in transit.
  const key = `${endpoint}/${randomUUID()}`;
  const object = await env.MEDIA_BUCKET.put(key, request.body, {
    httpMetadata: { contentType },
  });

  const bytesRead = object?.size ?? 0;
  if (!bytesRead) {
    await env.MEDIA_BUCKET.delete(key);
    return NextResponse.json({ error: "Missing file body." }, { status: 400 });
  }
  if (bytesRead > config.maxBytes) {
    await env.MEDIA_BUCKET.delete(key);
    return NextResponse.json(
      { error: `File must be under ${Math.round(config.maxBytes / (1024 * 1024))}MB.` },
      { status: 413 },
    );
  }

  const media = await getDb().media.create({
    data: {
      key,
      url: `/api/media/${key}`,
      kind: config.kind,
      bytes: bytesRead,
      mime: contentType,
    },
  });

  return NextResponse.json({
    id: media.id,
    url: media.url,
    key: media.key,
    width: media.width,
    height: media.height,
  });
}
