import { z } from "zod";

export const ContactSchema = z.object({
  eyebrow: z.string().max(40).default("Let's talk"),
  heading: z.string().max(100).default("Whatever you're making, let's"),
  headingAccent: z.string().max(60).default("make it felt."),
  intro: z
    .string()
    .max(220)
    .default(
      "Podcast, campaign, event or documentary — if it needs to move people, I'd love to cut it.",
    ),
  projectCtaLabel: z.string().max(40).default("Start a project"),
  callbackCtaLabel: z.string().max(40).default("Request a callback"),
  bestForLabel: z.string().max(30).default("Best for"),
  bestFor: z.string().max(120).default("Podcasts · campaigns · events · documentaries"),
  availabilityHeading: z.string().max(30).default("Availability"),
  locationLabel: z.string().max(30).default("Based in"),
  availableForFreelance: z.boolean().default(true),
  availabilityLabel: z.string().max(30).default("Available for freelance ·"),
  footerStatus: z.string().max(60),
  email: z.email(),
  location: z.string().max(80),
  phone: z.string().max(30).optional(),
  socials: z.object({
    linkedin: z.url().nullable(),
    instagram: z.url().nullable(),
    youtube: z.url().nullable(),
  }),
  footerTagline: z.string().max(160),
});

export type Contact = z.infer<typeof ContactSchema>;
