import { z } from "zod";

const CardBase = z.object({
  id: z.string(),
  fx: z.number().min(0).max(1),
  fy: z.number().min(0).max(1),
  rot: z.number().min(-8).max(8),
  pinType: z.enum(["pin", "pin-signal", "tape", "none"]).default("pin"),
});

const PolaroidSchema = CardBase.extend({
  type: z.literal("polaroid"),
  image: z.object({ url: z.url(), alt: z.string() }).nullable(),
  tint: z.enum(["rg1", "rg2", "rg3", "rg4", "rg5", "rg6"]),
  tag: z.string().max(20),
  caption: z.string().max(60),
  subCaption: z.string().max(40),
});

const StickyNoteSchema = CardBase.extend({
  type: z.literal("note"),
  color: z.enum(["ember", "signal"]),
  kicker: z.string().max(20),
  text: z.string().max(140),
});

const QuoteSchema = CardBase.extend({
  type: z.literal("quote"),
  text: z.string().max(200),
  attribution: z.string().max(60),
});

const InstagramCardSchema = CardBase.extend({
  type: z.literal("ig"),
  handle: z.string().max(30),
  tiles: z.array(z.enum(["rg1", "rg2", "rg3", "rg4", "rg5", "rg6"])).length(6),
  ctaLabel: z.string().max(40),
  ctaHref: z.url(),
});

const TagClusterCardSchema = CardBase.extend({
  type: z.literal("tags"),
  kicker: z.string().max(40),
  tags: z
    .array(
      z.object({
        label: z.string().max(20),
        tint: z.enum(["default", "ember", "signal"]).default("default"),
      }),
    )
    .max(12),
});

export const RoomSchema = z.object({
  teaser: z
    .object({
      eyebrow: z.string().max(40),
      kicker: z.string().max(80),
      heading: z.string().max(80),
      headingAccent: z.string().max(60),
      description: z.string().max(260),
      ctaLabel: z.string().max(60),
      stamp: z.string().max(40),
      note: z.string().max(60),
      invitation: z.string().max(40),
      invitationNote: z.string().max(40),
    })
    .default({
      eyebrow: "Off the clock",
      kicker: "A small side door in the portfolio",
      heading: "There's more in the",
      headingAccent: "cutting room.",
      description:
        "Not a reel. A living shelf of bike rides, half-finished thoughts, frames worth keeping, and the things that feed the work when the timeline is closed.",
      ctaLabel: "Open the Drawing Room",
      stamp: "Private archive",
      note: "01 / The reel between reels",
      invitation: "YOU'RE INVITED",
      invitationNote: "Open when curious",
    }),
  eyebrow: z.string().max(40).default("Off the clock"),
  title: z.string().max(80).default("The Drawing Room"),
  intro: z.string().max(240),
  shuffleLabel: z.string().max(40).default("Shuffle the board"),
  resetLabel: z.string().max(30).default("Reset"),
  closeEyebrow: z.string().max(40).default("That's the room"),
  closeHeading: z.string().max(80).default("Back to business?"),
  allowDrag: z.boolean().default(true),
  showShuffle: z.boolean().default(true),
  cards: z
    .array(
      z.discriminatedUnion("type", [
        PolaroidSchema,
        StickyNoteSchema,
        QuoteSchema,
        InstagramCardSchema,
        TagClusterCardSchema,
      ]),
    )
    .max(30),
});

export type Room = z.infer<typeof RoomSchema>;
