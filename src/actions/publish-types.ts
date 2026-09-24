export type PublishResult =
  /* `liveRefreshed: false` means the content is published but the live site's cache was not
     cleared; `retryLiveRefresh` retries just that step. */
  | Readonly<{ ok: true; publishedSections: number; liveRefreshed: boolean }>
  | Readonly<{ ok: false; error: string }>;

export type RevertResult =
  | Readonly<{ ok: true; revertedSections: number }>
  | Readonly<{ ok: false; error: string }>;
