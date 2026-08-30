/// <reference types="@cloudflare/workers-types" />

// Augments the `CloudflareEnv` interface declared by `@opennextjs/cloudflare` with this
// project's actual bindings (see wrangler.jsonc). `wrangler types` can generate a fuller
// version of this file locally, but that output is huge and gitignored — this hand-written
// version is committed so the same bindings type-check both locally and in CI.
export {};

declare global {
  interface CloudflareEnv {
    HYPERDRIVE: Hyperdrive;
    MEDIA_BUCKET: R2Bucket;
  }
}
