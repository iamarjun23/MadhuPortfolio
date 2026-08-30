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

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!contentLength || contentLength > config.maxBytes) {
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

  const key = `${endpoint}/${randomUUID()}`;
  await env.MEDIA_BUCKET.put(key, request.body, { httpMetadata: { contentType } });

  const media = await getDb().media.create({
    data: {
      key,
      url: `/api/media/${key}`,
      kind: config.kind,
      bytes: contentLength,
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
