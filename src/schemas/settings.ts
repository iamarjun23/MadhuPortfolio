import { z } from "zod";
import { ItemIdSchema, uniqueIds } from "./item-id";
import { ImageUrlSchema } from "./media";

const defaultBrand = {
  name: "madhu",
  suffix: ".edit",
  homeLabel: "madhu.edit home",
};

const defaultNavigation = {
  captionPrefix: "—",
  drawingRoomCaption: "The Drawing Room",
  resumeCaption: "Resume",
  workLabel: "Work",
  drawingRoomLabel: "Drawing Room",
  resumeLabel: "Resume",
  contactLabel: "Get in touch",
  portfolioLabel: "Portfolio",
  skipLinkLabel: "Skip to the work",
};

const defaultFooter = {
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
  experienceLabel: "Experience",
  drawingRoomLabel: "Drawing Room",
  contactHeading: "Get in touch",
  copyrightPrefix: "©",
  closingLine: "Stories shaped in Bengaluru",
};

export const defaultSiteSettings = {
  ownerName: "N Madhu Kumar",
  brand: defaultBrand,
  navigation: defaultNavigation,
  footer: defaultFooter,
};

export const SettingsSchema = z.object({
  seo: z.object({
    title: z.string().max(60),
    description: z.string().max(160),
    ogImage: z.object({ url: ImageUrlSchema }).nullable(),
  }),
  appearance: z.object({
    motion: z.boolean().default(true),
  }),
  /* One picture of the owner's own choosing to stand in wherever a photo has
     not been uploaded yet. Nothing is bundled with the site any more, so with
     this empty each section simply shows its own empty state. */
  fallbackImage: z.object({ url: ImageUrlSchema }).nullable().default(null),
  domain: z.string().max(60),
  site: z
    .object({
      ownerName: z.string().max(80).default(defaultSiteSettings.ownerName),
      brand: z
        .object({
          name: z.string().max(30).default(defaultBrand.name),
          suffix: z.string().max(12).default(defaultBrand.suffix),
          homeLabel: z.string().max(80).default(defaultBrand.homeLabel),
        })
        .default(defaultBrand),
      navigation: z
        .object({
          captionPrefix: z.string().max(20).default(defaultNavigation.captionPrefix),
          drawingRoomCaption: z.string().max(40).default(defaultNavigation.drawingRoomCaption),
          resumeCaption: z.string().max(40).default(defaultNavigation.resumeCaption),
          workLabel: z.string().max(30).default(defaultNavigation.workLabel),
          drawingRoomLabel: z.string().max(40).default(defaultNavigation.drawingRoomLabel),
          resumeLabel: z.string().max(30).default(defaultNavigation.resumeLabel),
          contactLabel: z.string().max(40).default(defaultNavigation.contactLabel),
          portfolioLabel: z.string().max(40).default(defaultNavigation.portfolioLabel),
          skipLinkLabel: z.string().max(80).default(defaultNavigation.skipLinkLabel),
        })
        .default(defaultNavigation),
      footer: z
        .object({
          eyebrow: z.string().max(80).default(defaultFooter.eyebrow),
          craftEyebrow: z.string().max(40).default(defaultFooter.craftEyebrow),
          craftHeading: z.string().max(80).default(defaultFooter.craftHeading),
          craftDescription: z.string().max(160).default(defaultFooter.craftDescription),
          skills: z
            .array(
              z.object({ id: ItemIdSchema, number: z.string().max(8), label: z.string().max(40) }),
            )
            .max(10)
            .superRefine(uniqueIds)
            .default(defaultFooter.skills),
          exploreHeading: z.string().max(40).default(defaultFooter.exploreHeading),
          selectedWorkLabel: z.string().max(40).default(defaultFooter.selectedWorkLabel),
          experienceLabel: z.string().max(40).default(defaultFooter.experienceLabel),
          drawingRoomLabel: z.string().max(40).default(defaultFooter.drawingRoomLabel),
          contactHeading: z.string().max(40).default(defaultFooter.contactHeading),
          copyrightPrefix: z.string().max(20).default(defaultFooter.copyrightPrefix),
          closingLine: z.string().max(100).default(defaultFooter.closingLine),
        })
        .default(defaultFooter),
    })
    .default(defaultSiteSettings),
});

export type Settings = z.infer<typeof SettingsSchema>;
