export const dynamic = "force-dynamic";

function pingResponse() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export function GET() {
  return pingResponse();
}

export function HEAD() {
  return pingResponse();
}
