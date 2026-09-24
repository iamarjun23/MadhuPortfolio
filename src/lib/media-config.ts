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

/** The object's first `length` bytes, fetched with a ranged GET rather than the whole file. */
export async function readObjectStart(key: string, length: number) {
  const response = await requireClient().fetch(objectUrl(key), {
    headers: { range: `bytes=0-${length - 1}` },
  });
  if (!response.ok) throw new Error(`Reading the start of ${key} answered ${response.status}`);
  return new Uint8Array(await response.arrayBuffer()).subarray(0, length);
}

export type StoredObject = Readonly<{ key: string; bytes: number; lastModified: Date }>;

const xmlText = (xml: string, tag: string) => new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml)?.[1];

/** One ListObjectsV2 page: its objects, and the token for the next page if there is one. */
export function parseListPage(xml: string) {
  const objects: StoredObject[] = [];
  for (const [, entry = ""] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
    const key = xmlText(entry, "Key");
    const lastModified = new Date(xmlText(entry, "LastModified") ?? "");
    if (key && !Number.isNaN(lastModified.getTime())) {
      objects.push({ key, bytes: Number(xmlText(entry, "Size") ?? 0), lastModified });
    }
  }
  const truncated = xmlText(xml, "IsTruncated") === "true";
  return { objects, nextToken: truncated ? xmlText(xml, "NextContinuationToken") : undefined };
}

/** Every object in the bucket, listed a page (up to 1,000 keys) at a time. */
export async function listObjects() {
  const objects: StoredObject[] = [];
  let token: string | undefined;
  do {
    const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}`);
    url.searchParams.set("list-type", "2");
    if (token) url.searchParams.set("continuation-token", token);
    const response = await requireClient().fetch(url.toString());
    if (!response.ok) throw new Error(`Listing the bucket answered ${response.status}`);
    const page = parseListPage(await response.text());
    objects.push(...page.objects);
    token = page.nextToken;
  } while (token);
  return objects;
}

/** Deleting a key that is already gone counts as success, so a retried delete can finish. */
export async function deleteObject(key: string) {
  const response = await requireClient().fetch(objectUrl(key), { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Deleting ${key} answered ${response.status}`);
  }
}
