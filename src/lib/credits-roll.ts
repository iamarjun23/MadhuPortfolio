/** One "credit" in the navbar island's credits roll. */
export type RollCredit = Readonly<{
  role: string;
  value: string;
  tone?: "status" | "cta" | "runtime" | "countdown";
}>;

type CreditsInput = Readonly<{
  /** Short names of the homepage sections on the timeline, in page order. */
  labels: readonly string[];
  /** The section the playhead is in, or -1 before the first one. */
  index: number;
  /** How far through that section the playhead is, 0-1. */
  progress: number;
  /** The availability line, or null when the owner is not taking work. */
  availability: string | null;
  contactLabel: string;
  /** Runtime seconds left in the current section, for the "Up next" countdown. */
  secondsLeft: number;
}>;

// The last stretch of a section, where the roll stops on "Up next".
const NEAR_END = 0.72;
// How far into the last section before the roll becomes the end credits.
const FINAL_STRETCH = 0.8;

/** Scroll distance as an HH:MM:SS:FF timecode at 24fps, one frame per 4px. */
export function formatTimecode(scrollY: number) {
  const frames = Math.max(0, Math.floor(scrollY / 4));
  const seconds = Math.floor(frames / 24);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60, frames % 24]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

/** Runtime seconds for a scroll distance, on the same scale as formatTimecode. */
export function runtimeSeconds(pixels: number) {
  return Math.max(0, pixels) / (4 * 24);
}

/**
 * The credits the island rolls through at this point on the page: the usual
 * loop mid-section, a single "Up next" countdown near a section's end, and
 * the end credits over the final stretch of the last section.
 */
export function creditsFor({
  labels,
  index,
  progress,
  availability,
  contactLabel,
  secondsLeft,
}: CreditsInput): RollCredit[] {
  const current = labels[index];
  if (current === undefined) return [];
  const next = labels[index + 1];
  const status: RollCredit[] = availability
    ? [{ role: "Status", value: availability, tone: "status" }]
    : [];

  if (next === undefined && progress >= FINAL_STRETCH) {
    return [
      { role: "Fin.", value: "Thanks for watching" },
      ...status,
      { role: "Next step", value: contactLabel, tone: "cta" },
    ];
  }

  if (next !== undefined && progress >= NEAR_END) {
    return [
      {
        role: "Up next",
        value: `${next} in ${Math.max(1, Math.ceil(secondsLeft))}s`,
        tone: "countdown",
      },
    ];
  }

  return [
    { role: "Now showing", value: current },
    ...status,
    { role: "Up next", value: next ?? contactLabel },
    { role: "Runtime", value: "", tone: "runtime" },
  ];
}
