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
  site: z
    .object({
      ownerName: z.string().max(80),
      brand: z.object({
        name: z.string().max(30),
        suffix: z.string().max(12),
        homeLabel: z.string().max(80),
      }),
      navigation: z.object({
        captionPrefix: z.string().max(20),
        drawingRoomCaption: z.string().max(40),
        workLabel: z.string().max(30),
        drawingRoomLabel: z.string().max(40),
        studioLabel: z.string().max(30),
        contactLabel: z.string().max(40),
        portfolioLabel: z.string().max(40),
        skipLinkLabel: z.string().max(80),
      }),
      footer: z.object({
        eyebrow: z.string().max(80),
        craftEyebrow: z.string().max(40),
        craftHeading: z.string().max(80),
        craftDescription: z.string().max(160),
        skills: z
          .array(z.object({ id: z.string(), number: z.string().max(8), label: z.string().max(40) }))
          .max(10),
        exploreHeading: z.string().max(40),
        selectedWorkLabel: z.string().max(40),
        photoboothLabel: z.string().max(40),
        experienceLabel: z.string().max(40),
        drawingRoomLabel: z.string().max(40),
        contactHeading: z.string().max(40),
        copyrightPrefix: z.string().max(20),
        closingLine: z.string().max(100),
      }),
    })
    .default({
      ownerName: "N Madhu Kumar",
      brand: { name: "madhu", suffix: ".edit", homeLabel: "madhu.edit home" },
      navigation: {
        captionPrefix: "—",
        drawingRoomCaption: "The Drawing Room",
        workLabel: "Work",
        drawingRoomLabel: "Drawing Room",
        studioLabel: "Studio",
        contactLabel: "Get in touch",
        portfolioLabel: "Portfolio",
        skipLinkLabel: "Skip to the work",
      },
      footer: {
        eyebrow: "End credits · Bengaluru",
        craftEyebrow: "The craft",
        craftHeading: "Built in the cut.",
        craftDescription: "From the first assembly to the final colour pass.",
        skills: [
          { id: "story-edit", number: "01", label: "Story edit" },
          { id: "premiere", number: "02", label: "Premiere Pro" },
          { id: "after-effects", number: "03", label: "After Effects" },
          { id: "colour", number: "04", label: "Colour & finish" },
          { id: "direction", number: "05", label: "On-camera direction" },
        ],
        exploreHeading: "Explore",
        selectedWorkLabel: "Selected work",
        photoboothLabel: "Photobooth",
        experienceLabel: "Experience",
        drawingRoomLabel: "Drawing Room",
        contactHeading: "Get in touch",
        copyrightPrefix: "©",
        closingLine: "Stories shaped in Bengaluru",
      },
    }),
});

export type Settings = z.infer<typeof SettingsSchema>;
