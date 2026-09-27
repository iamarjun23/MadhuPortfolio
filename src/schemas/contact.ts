import { z } from "zod";
import { ExternalLinkSchema } from "./links";

// Empty means no number. Otherwise international, since a WhatsApp link needs the
// country code; 8-15 digits is what E.164 allows.
const PhoneSchema = z.union([
  z.literal(""),
  z
    .string()
    .max(30)
    .regex(/^\+[\d\s().-]+$/, "Start with + and the country code, e.g. +91 98765 43210.")
    .refine((phone) => /^\d{8,15}$/.test(phone.replace(/\D/g, "")), "Use 8 to 15 digits."),
]);

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
  phone: PhoneSchema.optional(),
  socials: z.object({
    linkedin: ExternalLinkSchema.nullable(),
    instagram: ExternalLinkSchema.nullable(),
    youtube: ExternalLinkSchema.nullable(),
    // A number, not a link: the footer icon turns it into a wa.me chat link. The
    // default is a placeholder until the real number is entered in the Studio.
    whatsapp: PhoneSchema.default("+91 98765 43210"),
  }),
  footerTagline: z.string().max(160),
});

export type Contact = z.infer<typeof ContactSchema>;
