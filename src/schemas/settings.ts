import { z } from "zod";

export const SettingsSchema = z.object({
  seo: z.object({
    title: z.string().max(60),
    description: z.string().max(160),
    ogImage: z.object({ url: z.url() }).nullable(),
  }),
  appearance: z.object({
    defaultTheme: z.enum(["suite", "sheet", "system"]),
    showThemeToggle: z.boolean().default(true),
    motion: z.boolean().default(true),
  }),
  domain: z.string().max(60),
});

export type Settings = z.infer<typeof SettingsSchema>;
