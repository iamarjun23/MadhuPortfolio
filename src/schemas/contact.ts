import { z } from "zod";
import { isTimeZone } from "@/lib/contact-links";
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

// Stands in for the WhatsApp number until the real one is entered in the Studio.
export const placeholderWhatsapp = "+91 98765 43210";

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
  emailNote: z.string().max(80).default("Best for briefs, footage links and budgets."),
  callbackHeading: z.string().max(60).default("Rather talk it through?"),
  callbackNote: z.string().max(120).default("Leave your number and a good time to call."),
  callbackCtaLabel: z.string().max(40).default("Request a callback"),
  availableForFreelance: z.boolean().default(true),
  // The one availability line: navbar, contact card and footer all show it.
  footerStatus: z.string().max(60),
  email: z.email(),
  location: z.string().max(80),
  // Drives the "3:40 pm in Bengaluru" clock on the contact card.
  timeZone: z
    .string()
    .default("Asia/Kolkata")
    .refine(isTimeZone, "Use a time zone name like Asia/Kolkata."),
  phone: PhoneSchema.optional(),
  socials: z.object({
    linkedin: ExternalLinkSchema.nullable(),
    instagram: ExternalLinkSchema.nullable(),
    youtube: ExternalLinkSchema.nullable(),
    // A number, not a link: the footer icon turns it into a wa.me chat link.
    whatsapp: PhoneSchema.default(placeholderWhatsapp),
  }),
  footerTagline: z.string().max(160),
});

export type Contact = z.infer<typeof ContactSchema>;
