export type DeleteMediaResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: string }>;

export type MediaUploadResult = Readonly<{
  id: string;
  url: string;
  key: string;
  width: number | null;
  height: number | null;
}>;

export type CreateUploadResult =
  Readonly<{ ok: true; key: string; uploadUrl: string }> | Readonly<{ ok: false; error: string }>;

export type FinishUploadResult =
  Readonly<{ ok: true; media: MediaUploadResult }> | Readonly<{ ok: false; error: string }>;

export type UnusedMediaSummary = Readonly<{
  count: number;
  bytes: number;
}>;

export type UnusedMediaResult =
  Readonly<{ ok: true; summary: UnusedMediaSummary }> | Readonly<{ ok: false; error: string }>;

export type PurgeMediaResult =
  Readonly<{ ok: true; deleted: number; failed: number }> | Readonly<{ ok: false; error: string }>;
