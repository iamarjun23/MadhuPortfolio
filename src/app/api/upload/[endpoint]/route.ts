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

  // R2 requires the length of a streamed upload. Buffering here also verifies
  // the actual payload size rather than relying on a client-supplied header.
  const file = await request.arrayBuffer();
  if (!file.byteLength) {
    return NextResponse.json({ error: "Missing file body." }, { status: 400 });
  }
  if (file.byteLength > config.maxBytes) {
    return NextResponse.json(
      { error: `File must be under ${Math.round(config.maxBytes / (1024 * 1024))}MB.` },
      { status: 413 },
    );
  }

  const key = `${endpoint}/${randomUUID()}`;
  await env.MEDIA_BUCKET.put(key, file, { httpMetadata: { contentType } });

  const media = await getDb().media.create({
    data: {
      key,
      url: `/api/media/${key}`,
      kind: config.kind,
      bytes: file.byteLength,
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
