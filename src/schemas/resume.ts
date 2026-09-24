import { z } from "zod";
import { DocumentUrlSchema } from "./media";

export const ResumeSchema = z.object({
  eyebrow: z.string().max(40).default("Resume"),
  heading: z.string().max(80).default("The whole reel, on one page."),
  intro: z.string().max(280).default(""),
  pdf: z.object({ url: DocumentUrlSchema }).nullable().default(null),
  downloadLabel: z.string().max(40).default("Download PDF"),
  emptyMessage: z.string().max(160).default("The resume is on its way. Check back soon."),
  seo: z
    .object({
      title: z.string().max(60).default("Resume"),
      description: z.string().max(200).default(""),
    })
    .default({ title: "Resume", description: "" }),
});

export type Resume = z.infer<typeof ResumeSchema>;
