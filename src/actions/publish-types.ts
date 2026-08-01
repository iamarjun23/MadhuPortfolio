export type PublishResult =
  | Readonly<{ ok: true; publishedSections: number }>
  | Readonly<{ ok: false; error: string }>;

export type RevertResult =
  | Readonly<{ ok: true; revertedSections: number }>
  | Readonly<{ ok: false; error: string }>;
