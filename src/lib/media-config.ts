import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function isMediaUploadConfigured() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return Boolean(env.MEDIA_BUCKET);
  } catch {
    return false;
  }
}
