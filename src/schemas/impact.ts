import { z } from "zod";

export const ImpactSchema = z.object({
  heading: z.string().max(80).default("In the room with"),
  collaboratorsLabel: z.string().max(60).default("selected collaborators"),
  detailLabel: z.string().max(60).default("Selected collaboration"),
  campaignsHeading: z.string().max(80).default("Sponsorship campaigns"),
  campaignsDescription: z
    .string()
    .max(180)
    .default("Performance films cut for Jar's sponsorship of each show."),
  stats: z
    .array(
      z.object({
        value: z.string().max(8),
        label: z.string().max(40),
      }),
    )
    .length(4),
  worked: z
    .array(
      z.object({
        name: z.string().max(60),
        context: z.string().max(60),
        image: z.object({ url: z.url(), alt: z.string() }).nullable(),
      }),
    )
    .max(60),
  campaigns: z
    .array(
      z.object({
        name: z.string().max(60),
        context: z.string().max(100),
      }),
    )
    .max(12)
    .default([]),
});

export type Impact = z.infer<typeof ImpactSchema>;
