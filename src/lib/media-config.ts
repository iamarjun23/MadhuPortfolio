import { AwsClient } from "aws4fetch";

/* The studio runs on Vercel, away from the Worker's R2 binding, so it reaches the
   upload bucket through R2's S3-compatible API. Visitors read the files back from
   the bucket's custom domain (`NEXT_PUBLIC_MEDIA_URL`), which touches neither
   deployment. */
const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

const client =
  accountId && bucket && mediaUrl && accessKeyId && secretAccessKey
    ? new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" })
    : null;

// R2 checks the expiry when the PUT starts, not when it ends, so a slow 64MB video still lands.
const UPLOAD_URL_TTL_SECONDS = 15 * 60;

export function isMediaUploadConfigured() {
  return client !== null;
}

function requireClient() {
  if (!client) throw new Error("Uploads are not configured.");
  return client;
}

function objectUrl(key: string) {
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
}

export function mediaPublicUrl(key: string) {
  return `${mediaUrl}/${key}`;
}

export async function signUpload(key: string) {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(UPLOAD_URL_TTL_SECONDS));
  const signed = await requireClient().sign(url.toString(), {
    method: "PUT",
    aws: { signQuery: true },
  });
  return signed.url;
}

export function headObject(key: string) {
  return requireClient().fetch(objectUrl(key), { method: "HEAD" });
}

export async function deleteObject(key: string) {
  const response = await requireClient().fetch(objectUrl(key), { method: "DELETE" });
  if (!response.ok) throw new Error(`Deleting ${key} answered ${response.status}`);
}
