// bcryptjs is a pure-JS bcrypt implementation costing 50-300ms+ of synchronous CPU per
// call — well over the Workers Free plan's hard 10ms CPU-time cap (unlike Paid, Free
// cannot raise this limit), so login attempts were exceeding it. PBKDF2 via Web Crypto
// runs through workerd's native crypto bindings instead of JS, which is dramatically
// cheaper for the same iteration count and available identically in Workers and Node.
const ALGORITHM = "pbkdf2-sha256";
const ITERATIONS = 120_000;
/* The stored string carries the iteration count it was made with, so raising
   ITERATIONS later keeps old hashes verifiable rather than locking anyone out.
   The flip side is that the count is then whatever the database says - lower a
   row's number and the hash it guards gets cheaper to attack. This floor is what
   stops a hash weaker than anything this code would produce from being accepted,
   and it must never be raised above the weakest count still in use. */
const MINIMUM_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derive(password, salt, ITERATIONS);
  return [ALGORITHM, ITERATIONS, toBase64(salt), toBase64(derived)].join("$");
}

const LEGACY_BCRYPT_PREFIX = /^\$2[aby]\$/;

export async function verifyPassword(password: string, stored: string) {
  // ponytail: accounts hashed by the pre-migration bcrypt flow never get rehashed here,
  // so they pay bcrypt's CPU cost on every login. Rehash to the pbkdf2 format on a
  // successful legacy login (in auth.ts, where the DB write already happens) if that cost matters.
  if (LEGACY_BCRYPT_PREFIX.test(stored)) {
    const { compare } = await import("bcryptjs");
    return compare(password, stored);
  }

  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== ALGORITHM) return false;

  const iterations = Number(parts[1]);
  if (!Number.isSafeInteger(iterations) || iterations < MINIMUM_ITERATIONS) return false;

  const salt = fromBase64(parts[2] ?? "");
  const expected = fromBase64(parts[3] ?? "");
  const actual = await derive(password, salt, iterations);
  if (actual.length !== expected.length) return false;

  // Constant-time comparison: bailing out on the first mismatched byte would let a timing
  // attack narrow down the correct hash one byte at a time.
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= (actual[i] ?? 0) ^ (expected[i] ?? 0);
  return diff === 0;
}
