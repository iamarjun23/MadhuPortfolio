/* The type an upload is stored and served with is only what the browser claimed. These
   are the leading bytes each allowed format really starts with, so `finishUpload` can
   refuse, say, an HTML page renamed to `.jpg` before it is ever served back. */

/** How many leading bytes `sniffMimeType` needs to tell every allowed format apart. */
export const SIGNATURE_BYTES = 32;

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((byte, index) => bytes[index] === byte);

// Older QuickTime files open straight into one of these atoms, without an `ftyp` box.
const QUICKTIME_ATOMS = new Set(["moov", "mdat", "wide", "free", "skip"]);

/* An MP4/MOV box starts with its 4-byte big-endian size: 0 (runs to the end of the file),
   1 (a 64-bit size follows) or at least the 8-byte header, and never more than the file.
   Text posing as a box - `<!--free...` - reads as a size of about a gigabyte, so this is what
   stops four letters in the right place passing as a video. */
function boxSizeFits(bytes: Uint8Array, fileBytes: number) {
  if (bytes.length < 8) return false;
  const size = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0);
  return size === 0 || size === 1 || (size >= 8 && size <= fileBytes);
}

/** The allowed MIME type these leading bytes of a `fileBytes`-long file belong to, or null if none match. */
export function sniffMimeType(bytes: Uint8Array, fileBytes: number): string | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  if (ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";

  const box = ascii(bytes, 4, 8);
  if (!boxSizeFits(bytes, fileBytes)) return null;
  if (box === "ftyp") {
    const brand = ascii(bytes, 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    return brand === "qt  " ? "video/quicktime" : "video/mp4";
  }
  if (QUICKTIME_ATOMS.has(box)) return "video/quicktime";
  return null;
}

/** The file's real type if it is in the same family (image, video, PDF) as the type it was
    uploaded as, otherwise null. The browser picks the declared type from the file extension,
    so a PNG saved as `.jpg` or an MP4 saved as `.mov` is an honest mislabel, not a threat;
    what must never pass is, say, HTML or SVG markup posing as an image. */
export function verifiedMimeType(bytes: Uint8Array, declaredMime: string, fileBytes: number) {
  const actual = sniffMimeType(bytes, fileBytes);
  if (!actual) return null;
  return actual.split("/")[0] === declaredMime.split("/")[0] ? actual : null;
}
