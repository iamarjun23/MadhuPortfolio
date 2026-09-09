export type DeleteMediaResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: string }>;

export type UnusedMediaSummary = Readonly<{
  count: number;
  bytes: number;
}>;

export type UnusedMediaResult =
  Readonly<{ ok: true; summary: UnusedMediaSummary }> | Readonly<{ ok: false; error: string }>;

export type PurgeMediaResult =
  Readonly<{ ok: true; deleted: number; failed: number }> | Readonly<{ ok: false; error: string }>;
