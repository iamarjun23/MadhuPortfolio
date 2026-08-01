import type { NextRequest } from "next/server";
import { createRouteHandler } from "uploadthing/next";
import { isUploadThingConfigured } from "@/lib/uploadthing-config";
import { ourFileRouter } from "@/lib/uploadthing";

const handlers = createRouteHandler({ router: ourFileRouter });

function unavailableResponse() {
  return Response.json(
    { error: "Uploads are not configured. Add UPLOADTHING_TOKEN to enable media uploads." },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  return isUploadThingConfigured() ? handlers.GET(request) : unavailableResponse();
}

export async function POST(request: NextRequest) {
  return isUploadThingConfigured() ? handlers.POST(request) : unavailableResponse();
}
