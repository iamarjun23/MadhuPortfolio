import { z } from "zod";

export const WorkSchema = z.object({
  lanes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().max(40),
        subLabel: z.string().max(40),
        headline: z.string().max(120),
        approach: z.string().max(300),
        chips: z.array(z.string().max(24)).max(6),
        loadTc: z.string().max(20),
        briefLabel: z.string().max(40),
        projects: z
          .array(
            z.object({
              id: z.string(),
              title: z.string().max(80),
              subtitle: z.string().max(60),
              href: z.url().nullable(),
              hrefLabel: z.string().max(16).nullable(),
              thumbHint: z.enum(["bd-1", "bd-2", "bd-3", "bd-4"]),
            }),
          )
          .max(20),
      }),
    )
    .min(1)
    .max(6),
});

export type Work = z.infer<typeof WorkSchema>;
