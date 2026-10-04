import { z } from "zod";
import { DocumentUrlSchema } from "./media";

/* Just the PDF: the menu's Resume link opens it in a new tab and downloads a copy. */
export const ResumeSchema = z.object({
  pdf: z.object({ url: DocumentUrlSchema }).nullable().default(null),
});

export type Resume = z.infer<typeof ResumeSchema>;
