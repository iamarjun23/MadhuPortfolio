import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import {
  isAllowedMimeType,
  isUploadEndpoint,
  normalizeMimeType,
  uploadEndpoints,
} from "@/lib/media-upload";

type RouteParams = Readonly<{ params: Promise<{ endpoint: string }> }>;

async function discard(bucket: R2Bucket, key: string) {
  try {
    await bucket.delete(key);
  } catch (error) {
    console.error(`Could not remove the orphaned upload ${key}`, error);
  }
}

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
  const contentType = normalizeMimeType(request.headers.get("content-type") ?? "");
  if (!isAllowedMimeType(contentType, config.accept)) {
    return NextResponse.json(
      {
        error:
          config.accept === "image/"
            ? "Choose a JPEG, PNG, WebP, AVIF or GIF image."
            : "Choose an MP4, WebM or MOV video.",
      },
      { status: 415 },
    );
  }

  const declaredBytes = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isSafeInteger(declaredBytes) || declaredBytes <= 0) {
    return NextResponse.json({ error: "Missing file body." }, { status: 400 });
  }
  if (declaredBytes > config.maxBytes) {
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

  // Stream the request body straight through to R2 instead of buffering the whole file in
  // the Worker's heap first: a full-size video (up to 64MB) alongside the rest of the
  // request work risked exceeding the Worker's 128MB memory limit.
  //
  // R2 refuses a ReadableStream whose length it cannot determine, and Next rebuilds the
  // incoming request through its Node adapter, so `request.body` arrives here as a plain
  // stream with no length attached — which is why passing it (or a hand-rolled
  // TransformStream over it) straight to `put` failed with an opaque 500 on every file
  // size. FixedLengthStream re-attaches the declared Content-Length; a body that does not
  // match the header errors the stream rather than storing a truncated object, so the size
  // check above holds for the bytes actually written.
  //
  // FixedLengthStream is a workerd-only global: it exists in the deployed Worker but not in
  // the plain Node.js process `next dev` runs API routes in, where constructing one throws
  // immediately. Buffering there instead is fine - dev uploads never approach the Worker's
  // memory limit because there is no Worker.
  const key = `${endpoint}/${randomUUID()}`;
  try {
    const body =
      typeof FixedLengthStream === "undefined"
        ? await request.arrayBuffer()
        : request.body.pipeThrough(new FixedLengthStream(declaredBytes));
    await env.MEDIA_BUCKET.put(key, body, {
      httpMetadata: { contentType },
    });
  } catch (error) {
    console.error(`Storing the ${endpoint} upload failed`, error);
    await discard(env.MEDIA_BUCKET, key);
    return NextResponse.json({ error: "Could not store the file." }, { status: 500 });
  }

  try {
    const media = await getDb().media.create({
      data: {
        key,
        url: `/api/media/${key}`,
        kind: config.kind,
        bytes: declaredBytes,
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
  } catch (error) {
    console.error(`Recording the ${endpoint} upload failed`, error);
    await discard(env.MEDIA_BUCKET, key);
    return NextResponse.json({ error: "Could not record the upload." }, { status: 500 });
  }
}
