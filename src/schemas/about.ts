import { z } from "zod";

export const AboutSchema = z.object({
  portrait: z.object({ url: z.url(), alt: z.string() }).nullable(),
  heading: z.string().max(80),
  paragraphs: z.array(z.string().max(500)).min(1).max(4),
  currentStatus: z.string().max(80),
  skills: z.array(z.string().max(32)).max(20),
});

export type About = z.infer<typeof AboutSchema>;
