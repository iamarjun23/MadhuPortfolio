import { z } from "zod";

export const ContactSchema = z.object({
  availableForFreelance: z.boolean().default(true),
  availabilityLabel: z.string().max(30).default("Available"),
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
