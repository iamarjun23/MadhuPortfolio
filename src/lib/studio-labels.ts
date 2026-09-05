import type { SectionKey } from "@/lib/sections";

/* Every studio field is rendered straight from draft JSON, so the editor needs a
   dictionary to turn keys like `bgVideo` or `fx` into something an editor who has
   never seen the schema can act on: a plain-English name, a sentence about where
   it shows up on the live page, and - for uploads - whether it wants a photo or
   a video. */

export type MediaKindLabel = "photo" | "video";

export type FieldDoc = Readonly<{
  label: string;
  hint?: string;
  /** Singular noun used for entries of an array field ("Project 3"). */
  itemLabel?: string;
  media?: MediaKindLabel;
}>;

export const mediaSpecs: Record<
  MediaKindLabel,
  Readonly<{ badge: string; accepts: string; action: string }>
> = {
  photo: {
    badge: "Photo",
    accepts: "Image file - JPG, PNG or WebP, up to 4 MB",
    action: "Upload photo",
  },
  video: {
    badge: "Video",
    accepts: "Video file - MP4 or WebM, up to 64 MB",
    action: "Upload video",
  },
};

export const sectionDocs: Record<SectionKey, Readonly<{ summary: string; media: string }>> = {
  hero: {
    summary:
      "The full-screen opening scene: the headline, the two buttons, and the film-strip labels around the frame.",
    media: "One background video that loops silently behind the headline.",
  },
  about: {
    summary: "Your story panel: portrait, paragraphs, current status and the tools you work in.",
    media: "One portrait photo, plus an optional portrait video that replaces it.",
  },
  impact: {
    summary:
      "The numbers strip and the list of people and brands you have worked with, plus sponsorship campaigns.",
    media: "One photo per collaborator (optional - initials show when empty).",
  },
  work: {
    summary:
      "Your selected work board. Cards are grouped into categories, and visitors drag them around and click to play the video.",
    media:
      "Nothing is uploaded here. Paste each project's YouTube link and it supplies the card thumbnail and the pop-up player on its own.",
  },
  booth: {
    summary:
      "The photobooth wall of on-set moments. Clicking a photo opens it full size in a lightbox.",
    media: "One photo per slot - this section is entirely photos.",
  },
  praise: {
    summary:
      "Client and collaborator testimonials. The whole section stays hidden until you switch it on.",
    media: "An optional photo per person - initials are used when there is none.",
  },
  experience: {
    summary:
      "Your career told as scenes: one entry per role, with dates, location and what you did there.",
    media: "Each role takes a scene photo and a company logo image.",
  },
  room: {
    summary:
      "The Drawing Room pinboard - polaroids, sticky notes, quotes and an Instagram card scattered on a wall.",
    media: "Polaroid cards hold photos. Notes, quotes and tag cards are text only.",
  },
  contact: {
    summary: "The closing invitation plus your real contact details, social links and footer line.",
    media: "No uploads - this section is text and links only.",
  },
  settings: {
    summary:
      "Site-wide settings shared by every page: brand wordmark, menu labels, footer, SEO and theme.",
    media: "One social share image, used when your link is pasted into WhatsApp, Slack or X.",
  },
};

export function labelFor(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

type FieldRule = Readonly<{
  key: string;
  /** Every entry must appear somewhere in the field's path for the rule to win. */
  within?: readonly string[];
  doc: FieldDoc;
}>;

/* Ordered most-specific first: the first rule whose key and ancestors match wins. */
const fieldRules: readonly FieldRule[] = [
  /* ---------- Uploads ---------- */
  {
    key: "bgVideo",
    doc: {
      label: "Background video",
      media: "video",
      hint: "Plays muted and on a loop behind the hero headline. Add a poster image below so something is visible while it loads.",
    },
  },
  {
    key: "portraitVideo",
    doc: {
      label: "Portrait video (optional)",
      media: "video",
      hint: "A short looping clip of you that replaces the portrait photo. Leave the URL empty to keep the still photo.",
    },
  },
  {
    key: "portrait",
    doc: {
      label: "Portrait photo",
      media: "photo",
      hint: "The photo of you beside your story. Portrait orientation works best.",
    },
  },
  {
    key: "ogImage",
    doc: {
      label: "Social share image",
      media: "photo",
      hint: "Shown when someone pastes your link into WhatsApp, Slack, LinkedIn or X. A 1200 x 630 image is ideal.",
    },
  },
  {
    key: "logo",
    within: ["roles"],
    doc: {
      label: "Company logo",
      media: "photo",
      hint: "The company's logo mark. A PNG with a transparent background works best. Leave it empty to fall back to the initials.",
    },
  },
  {
    key: "image",
    within: ["slots"],
    doc: {
      label: "Photobooth photo",
      media: "photo",
      hint: "The on-set photograph for this slot. It opens full size when a visitor clicks it.",
    },
  },
  {
    key: "image",
    within: ["quotes"],
    doc: {
      label: "Person's photo",
      media: "photo",
      hint: "Headshot of the person quoted. Optional - their initials are shown when there is no photo.",
    },
  },
  {
    key: "image",
    within: ["roles"],
    doc: {
      label: "Scene photo",
      media: "photo",
      hint: "A photo from this chapter of your career, shown behind the role's scene.",
    },
  },
  {
    key: "image",
    within: ["worked"],
    doc: {
      label: "Collaborator photo or logo",
      media: "photo",
      hint: "Optional. Shown in the collaborators row - initials are used when it is empty.",
    },
  },
  {
    key: "image",
    within: ["cards"],
    doc: {
      label: "Polaroid photo",
      media: "photo",
      hint: "The picture inside this polaroid card on the pinboard.",
    },
  },
  { key: "image", doc: { label: "Photo", media: "photo", hint: "Image shown in this section." } },

  /* ---------- Hero ---------- */
  {
    key: "eyebrow",
    doc: { label: "Eyebrow line", hint: "The small line of text sitting above the main heading." },
  },
  { key: "line1", doc: { label: "Headline - first line", hint: "Max 60 characters." } },
  { key: "line2", doc: { label: "Headline - second line", hint: "Max 60 characters." } },
  {
    key: "cutWords",
    doc: {
      label: "Rotating words",
      itemLabel: "Word",
      hint: "These words swap one after another inside the headline. One word per entry.",
    },
  },
  {
    key: "sub",
    doc: { label: "Sub-headline", hint: "The paragraph under the headline. Max 220 characters." },
  },
  { key: "primaryCta", doc: { label: "Main button", hint: "The filled button in the hero." } },
  {
    key: "secondaryCta",
    doc: { label: "Second button", hint: "The outlined button next to the main one." },
  },
  {
    key: "label",
    within: ["primaryCta"],
    doc: { label: "Button text", hint: "What the main button says." },
  },
  {
    key: "href",
    within: ["primaryCta"],
    doc: {
      label: "Button link",
      hint: "Where it goes. Use #work for a section on this page, or a full https:// address.",
    },
  },
  {
    key: "label",
    within: ["secondaryCta"],
    doc: { label: "Button text", hint: "What the second button says." },
  },
  {
    key: "href",
    within: ["secondaryCta"],
    doc: {
      label: "Button link",
      hint: "Where it goes. Use #work for a section on this page, or a full https:// address.",
    },
  },
  {
    key: "reelLabel",
    doc: { label: "Reel slate label", hint: "Film-slate text in the corner of the hero frame." },
  },
  {
    key: "aspectRatioLabel",
    doc: { label: "Aspect ratio label", hint: "Decorative frame marking, e.g. 2.39 : 1." },
  },
  { key: "creditLine1", doc: { label: "Credit line 1", hint: "First line of the frame credits." } },
  {
    key: "creditLine2",
    doc: { label: "Credit line 2", hint: "Second line of the frame credits." },
  },
  {
    key: "footerLeftLabel",
    doc: { label: "Frame label - bottom left", hint: "Small decorative label in the hero frame." },
  },
  {
    key: "footerRightLabel",
    doc: { label: "Frame label - bottom right", hint: "Small decorative label in the hero frame." },
  },
  {
    key: "poster",
    doc: {
      label: "Poster image URL",
      hint: "The still frame shown while the video loads, or if it cannot play. Paste an image address.",
    },
  },
  {
    key: "duotone",
    doc: {
      label: "Duotone tint",
      hint: "Washes the video in the site's orange-and-black treatment. Turn it off to show the original colours.",
    },
  },

  /* ---------- About ---------- */
  {
    key: "paragraphs",
    doc: {
      label: "Story paragraphs",
      itemLabel: "Paragraph",
      hint: "One paragraph per entry, up to six. They stack under the heading.",
    },
  },
  {
    key: "statusLabel",
    doc: { label: "Status label", hint: 'The word above your status, e.g. "Status".' },
  },
  {
    key: "currentStatus",
    doc: {
      label: "Current status",
      hint: 'What you are up to right now, e.g. "Open to freelance".',
    },
  },
  {
    key: "skillsLabel",
    doc: { label: "Tools label", hint: 'Heading above the tools list, e.g. "Tools".' },
  },
  {
    key: "skills",
    within: ["footer"],
    doc: {
      label: "Footer craft list",
      itemLabel: "Skill",
      hint: "The numbered list of skills in the site footer.",
    },
  },
  {
    key: "skills",
    doc: { label: "Tools", itemLabel: "Tool", hint: "One tool or skill per entry." },
  },
  {
    key: "skillGroups",
    doc: {
      label: "Grouped tools",
      itemLabel: "Group",
      hint: 'Tools sorted into headed groups, e.g. "Software", "Learning".',
    },
  },
  {
    key: "label",
    within: ["skillGroups"],
    doc: { label: "Group name", hint: "Heading for this set of tools." },
  },
  {
    key: "items",
    within: ["skillGroups"],
    doc: { label: "Tools in this group", itemLabel: "Tool", hint: "One tool per entry." },
  },

  /* ---------- Impact ---------- */
  {
    key: "stats",
    doc: {
      label: "Numbers strip",
      itemLabel: "Stat",
      hint: "Exactly four figures. Each has a number and a caption.",
    },
  },
  {
    key: "value",
    within: ["stats"],
    doc: { label: "The number", hint: 'The large figure, max 8 characters - e.g. "40+".' },
  },
  {
    key: "label",
    within: ["stats"],
    doc: { label: "Caption", hint: 'The words under the number - e.g. "brands cut for".' },
  },
  {
    key: "worked",
    doc: {
      label: "Collaborators",
      itemLabel: "Collaborator",
      hint: "People and brands you have worked with. Each can carry a photo or logo.",
    },
  },
  { key: "name", within: ["worked"], doc: { label: "Collaborator name" } },
  {
    key: "context",
    within: ["worked"],
    doc: {
      label: "What you made for them",
      hint: 'Short line under the name, e.g. "Sponsorship films".',
    },
  },
  {
    key: "campaigns",
    doc: {
      label: "Campaigns",
      itemLabel: "Campaign",
      hint: "Sponsorship campaigns, listed as text.",
    },
  },
  { key: "name", within: ["campaigns"], doc: { label: "Campaign name" } },
  { key: "context", within: ["campaigns"], doc: { label: "Campaign detail" } },
  { key: "collaboratorsLabel", doc: { label: "Collaborators caption" } },
  { key: "detailLabel", doc: { label: "Selected collaboration caption" } },
  { key: "campaignsHeading", doc: { label: "Campaigns heading" } },
  { key: "campaignsDescription", doc: { label: "Campaigns description" } },

  /* ---------- Work ---------- */
  {
    key: "lanes",
    doc: {
      label: "Categories",
      itemLabel: "Category",
      hint: "Each category becomes a filter chip. Its projects are the cards shown when it is selected.",
    },
  },
  {
    key: "label",
    within: ["lanes"],
    doc: { label: "Category name", hint: "Text on the filter chip above the cards." },
  },
  {
    key: "projects",
    doc: {
      label: "Projects in this category",
      itemLabel: "Project",
      hint: "One card per project. Drag the list to change the order visitors see.",
    },
  },
  { key: "title", within: ["projects"], doc: { label: "Project title" } },
  {
    key: "subtitle",
    within: ["projects"],
    doc: { label: "Client or format", hint: "The small line under the title on the card." },
  },
  {
    key: "href",
    within: ["projects"],
    doc: {
      label: "YouTube link",
      hint: "The whole project in one field - no cover photo needed. Paste the video's YouTube address (youtu.be/... or youtube.com/watch?v=... both work) and it becomes the card thumbnail, the player inside the pop-up, and the link out. Paste a different address over it any time to swap the video. A non-YouTube link (a LinkedIn post, say) still opens from the pop-up, but gets no thumbnail and no in-page player.",
    },
  },
  {
    key: "hrefLabel",
    within: ["projects"],
    doc: {
      label: "Watch link label",
      hint: 'Text on the link out of the pop-up, e.g. "YouTube". Leave it as None to hide the label.',
    },
  },
  {
    key: "thumbHint",
    doc: {
      label: "Card gradient",
      hint: "The colour wash behind the card. It shows on its own until the project has a YouTube link. bd-1 to bd-4 are the four presets.",
    },
  },
  { key: "allProjectsLabel", doc: { label: '"All projects" caption' } },
  {
    key: "videoCountLabel",
    doc: { label: "Video count word", hint: 'The word after the number, e.g. "videos".' },
  },
  { key: "allFilterLabel", doc: { label: '"All work" chip text' } },
  {
    key: "briefPrompt",
    doc: { label: "Brief prompt", hint: 'Nudge above the hire button, e.g. "Have a story?".' },
  },
  { key: "briefCta", doc: { label: "Brief button text" } },
  {
    key: "canvasHint",
    doc: {
      label: "Canvas instructions",
      hint: "The line telling visitors they can drag the cards.",
    },
  },
  {
    key: "previewUnavailableLabel",
    doc: {
      label: "No-preview message",
      hint: "Shown inside the pop-up when a project has no YouTube link yet.",
    },
  },

  /* ---------- Photobooth ---------- */
  {
    key: "slots",
    doc: {
      label: "Photo slots",
      itemLabel: "Photo",
      hint: "One entry per photograph on the wall. Drag to reorder.",
    },
  },
  {
    key: "title",
    within: ["slots"],
    doc: { label: "Photo title", hint: "Caption printed on the photo card." },
  },
  { key: "subtitle", within: ["slots"], doc: { label: "Photo subtitle" } },
  {
    key: "lightboxCaption",
    doc: { label: "Full-size caption", hint: "Shown under the photo when it is opened full size." },
  },
  {
    key: "hasTape",
    doc: { label: "Show tape", hint: "Draws a strip of tape across the corner of this photo." },
  },
  {
    key: "tile",
    doc: {
      label: "Wall position",
      hint: "Which spot on the photo wall this fills, a through h. Each letter is a different size and tilt.",
    },
  },
  { key: "lightboxCloseLabel", doc: { label: '"Close" button text' } },
  { key: "lightboxPreviousLabel", doc: { label: '"Previous" button text' } },
  { key: "lightboxNextLabel", doc: { label: '"Next" button text' } },

  /* ---------- Praise ---------- */
  {
    key: "visible",
    doc: {
      label: "Show this section on the site",
      hint: "Off by default. Turn it on once you have real quotes - the whole section is hidden while it is off.",
    },
  },
  {
    key: "quotes",
    doc: {
      label: "Testimonials",
      itemLabel: "Testimonial",
      hint: "One entry per quote. Drag to reorder.",
    },
  },
  { key: "quote", doc: { label: "The quote", hint: "What they said. Max 280 characters." } },
  { key: "name", within: ["quotes"], doc: { label: "Person's name" } },
  { key: "role", within: ["quotes"], doc: { label: "Their role and company" } },
  {
    key: "isSample",
    doc: {
      label: "Mark as sample",
      hint: 'Flags the quote as a placeholder, so it is labelled "Sample quote" on the site.',
    },
  },
  { key: "sampleLabel", doc: { label: "Sample badge text" } },

  /* ---------- Experience ---------- */
  {
    key: "roles",
    doc: {
      label: "Career scenes",
      itemLabel: "Role",
      hint: "One entry per job. Drag to change the order they are stepped through.",
    },
  },
  { key: "company", doc: { label: "Company or studio" } },
  { key: "role", within: ["roles"], doc: { label: "Your job title" } },
  {
    key: "description",
    within: ["roles"],
    doc: {
      label: "What you did there",
      hint: "Up to 400 characters. Shown when this scene is open.",
    },
  },
  {
    key: "logoHint",
    doc: {
      label: "Built-in logo",
      hint: 'Use one of the packaged logo marks, or pick "custom" and upload a Company logo above.',
    },
  },
  { key: "start", doc: { label: "Start date", hint: 'Free text, e.g. "Jan 2023".' } },
  { key: "end", doc: { label: "End date", hint: 'Free text, e.g. "Present".' } },
  { key: "duration", doc: { label: "Length of time", hint: 'Free text, e.g. "1 yr 4 mos".' } },
  { key: "location", doc: { label: "Location", hint: "City or studio. Optional." } },
  {
    key: "defaultLocation",
    doc: { label: "Fallback location", hint: "Used for roles with no location set." },
  },
  { key: "sceneLabel", doc: { label: '"Scene" word (singular)' } },
  { key: "scenesLabel", doc: { label: '"Scenes" word (plural)' } },
  { key: "previousLabel", doc: { label: '"Previous scene" button text' } },
  { key: "nextLabel", doc: { label: '"Next scene" button text' } },

  /* ---------- Drawing Room ---------- */
  {
    key: "teaser",
    doc: {
      label: "Teaser panel (on the home page)",
      hint: "The block on the main page that invites visitors into the Drawing Room.",
    },
  },
  {
    key: "cards",
    doc: {
      label: "Pinboard cards",
      itemLabel: "Card",
      hint: "Everything pinned to the wall. The card type decides which of the fields below apply.",
    },
  },
  {
    key: "type",
    within: ["cards"],
    doc: {
      label: "Card type",
      hint: "polaroid = a photo, note = sticky note, quote = a quotation, ig = Instagram card, tags = word cluster. Changing this changes the fields below.",
    },
  },
  {
    key: "fx",
    doc: {
      label: "Horizontal position",
      hint: "Where the card sits across the board: 0 is hard left, 1 is hard right.",
    },
  },
  {
    key: "fy",
    doc: {
      label: "Vertical position",
      hint: "Where the card sits down the board: 0 is the top, 1 is the bottom.",
    },
  },
  {
    key: "rot",
    doc: { label: "Tilt", hint: "Rotation in degrees, from -8 to 8. Use 0 for straight." },
  },
  {
    key: "pinType",
    doc: {
      label: "Pin style",
      hint: "How the card is fixed to the wall: a pin, an orange pin, tape, or nothing.",
    },
  },
  {
    key: "tint",
    within: ["tags"],
    doc: { label: "Tag colour", hint: "default, ember (orange) or signal (bright)." },
  },
  { key: "tint", doc: { label: "Paper tint", hint: "Background shade of the card, rg1 to rg6." } },
  { key: "tag", doc: { label: "Corner tag", hint: "Tiny label in the corner of the polaroid." } },
  { key: "caption", doc: { label: "Caption", hint: "The handwriting line under the photo." } },
  { key: "subCaption", doc: { label: "Second caption", hint: "Smaller line under the caption." } },
  { key: "color", doc: { label: "Note colour", hint: "ember (orange) or signal (bright)." } },
  {
    key: "kicker",
    within: ["cards"],
    doc: { label: "Small heading", hint: "Tiny line at the top of the card." },
  },
  {
    key: "text",
    within: ["cards"],
    doc: { label: "Card text", hint: "The words on this note or quote card." },
  },
  { key: "attribution", doc: { label: "Who said it" } },
  { key: "handle", doc: { label: "Instagram handle", hint: 'Include the @, e.g. "@madhu.edit".' } },
  {
    key: "tiles",
    doc: {
      label: "Grid colours",
      itemLabel: "Tile",
      hint: "Exactly six colour swatches, rg1 to rg6, forming the mini Instagram grid.",
    },
  },
  { key: "ctaLabel", doc: { label: "Button text" } },
  { key: "ctaHref", doc: { label: "Button link", hint: "Full https:// address." } },
  {
    key: "tags",
    doc: { label: "Word cluster", itemLabel: "Tag", hint: "Short words scattered on the card." },
  },
  { key: "label", within: ["tags"], doc: { label: "Tag text" } },
  { key: "allowDrag", doc: { label: "Let visitors drag the cards" } },
  { key: "showShuffle", doc: { label: "Show the shuffle button" } },
  { key: "shuffleLabel", doc: { label: "Shuffle button text" } },
  { key: "resetLabel", doc: { label: "Reset button text" } },
  {
    key: "closeEyebrow",
    doc: { label: "Closing eyebrow", hint: "Small line above the sign-off at the bottom." },
  },
  { key: "closeHeading", doc: { label: "Closing heading" } },
  {
    key: "stamp",
    doc: {
      label: "Stamp text",
      hint: 'The stamped marking on the teaser, e.g. "Private archive".',
    },
  },
  { key: "note", doc: { label: "Teaser note", hint: "Small line beside the teaser stamp." } },
  {
    key: "invitation",
    doc: { label: "Invitation label", hint: 'Usually "YOU’RE INVITED".' },
  },
  { key: "invitationNote", doc: { label: "Invitation note" } },

  /* ---------- Contact ---------- */
  {
    key: "headingAccent",
    doc: { label: "Heading - highlighted part", hint: "This half is drawn in the accent colour." },
  },
  { key: "projectCtaLabel", doc: { label: '"Start a project" button text' } },
  { key: "callbackCtaLabel", doc: { label: '"Request a callback" button text' } },
  { key: "bestForLabel", doc: { label: '"Best for" label' } },
  {
    key: "bestFor",
    doc: {
      label: "Best for - the list",
      hint: 'The kinds of work you want, e.g. "Podcasts, campaigns, events".',
    },
  },
  { key: "availabilityHeading", doc: { label: "Availability heading" } },
  {
    key: "availableForFreelance",
    doc: {
      label: "Available for freelance",
      hint: "Switches the availability dot on and off.",
    },
  },
  { key: "availabilityLabel", doc: { label: "Availability text" } },
  { key: "locationLabel", doc: { label: '"Based in" label' } },
  {
    key: "email",
    doc: {
      label: "Email address",
      hint: "Must be a real address - the contact buttons link to it.",
    },
  },
  { key: "phone", doc: { label: "Phone number", hint: "Optional." } },
  {
    key: "socials",
    doc: {
      label: "Social links",
      hint: "Full https:// addresses. Leave one empty to hide that icon.",
    },
  },
  { key: "linkedin", doc: { label: "LinkedIn URL" } },
  { key: "instagram", doc: { label: "Instagram URL" } },
  { key: "youtube", doc: { label: "YouTube URL" } },
  { key: "footerStatus", doc: { label: "Footer status line" } },
  { key: "footerTagline", doc: { label: "Footer tagline" } },

  /* ---------- Site & navigation ---------- */
  {
    key: "seo",
    doc: {
      label: "Search & sharing",
      hint: "How your site looks in Google results and in link previews.",
    },
  },
  {
    key: "title",
    within: ["seo"],
    doc: {
      label: "Browser & search title",
      hint: "Max 60 characters. Appears in the browser tab and in Google results.",
    },
  },
  {
    key: "description",
    within: ["seo"],
    doc: {
      label: "Search description",
      hint: "Max 160 characters. The grey line under your title in search results.",
    },
  },
  {
    key: "appearance",
    doc: { label: "Appearance", hint: "Theme and motion defaults for visitors." },
  },
  {
    key: "defaultTheme",
    doc: {
      label: "Default theme",
      hint: "suite = dark, sheet = light, system = follow the visitor's device.",
    },
  },
  {
    key: "showThemeToggle",
    doc: { label: "Show the theme toggle", hint: "Lets visitors switch between the two themes." },
  },
  {
    key: "motion",
    doc: { label: "Enable animations", hint: "Turn this off for a still, reduced-motion site." },
  },
  {
    key: "domain",
    doc: {
      label: "Site domain",
      hint: "Your live address, used to build share links and the sitemap.",
    },
  },
  { key: "site", doc: { label: "Brand, menu & footer" } },
  {
    key: "ownerName",
    doc: { label: "Your full name", hint: "Used in credits and the copyright line." },
  },
  {
    key: "brand",
    doc: { label: "Wordmark", hint: "The logo text in the top-left of every page." },
  },
  {
    key: "name",
    within: ["brand"],
    doc: { label: "Wordmark - first part", hint: 'e.g. "madhu".' },
  },
  {
    key: "suffix",
    doc: { label: "Wordmark - accent part", hint: 'The coloured tail, e.g. ".edit".' },
  },
  {
    key: "homeLabel",
    doc: {
      label: "Wordmark link description",
      hint: "Read aloud by screen readers when they reach the logo.",
    },
  },
  {
    key: "navigation",
    doc: { label: "Menu labels", hint: "The words used in the top navigation." },
  },
  {
    key: "captionPrefix",
    doc: { label: "Menu caption prefix", hint: "Small mark before a menu caption." },
  },
  { key: "drawingRoomCaption", doc: { label: "Drawing Room caption" } },
  { key: "workLabel", doc: { label: '"Work" menu item' } },
  { key: "drawingRoomLabel", doc: { label: '"Drawing Room" menu item' } },
  { key: "studioLabel", doc: { label: '"Studio" menu item' } },
  {
    key: "studioHref",
    doc: { label: '"Studio" menu link', hint: "Where the Studio menu item points, e.g. /process." },
  },
  { key: "contactLabel", doc: { label: '"Get in touch" menu item' } },
  { key: "portfolioLabel", doc: { label: '"Portfolio" menu item' } },
  {
    key: "skipLinkLabel",
    doc: {
      label: "Skip-to-content link",
      hint: "The first thing a keyboard user reaches. Keep it descriptive.",
    },
  },
  {
    key: "footer",
    doc: { label: "Footer", hint: "The end-credits block at the bottom of every page." },
  },
  { key: "craftEyebrow", doc: { label: "Craft eyebrow" } },
  { key: "craftHeading", doc: { label: "Craft heading" } },
  { key: "craftDescription", doc: { label: "Craft description" } },
  { key: "label", within: ["footer", "skills"], doc: { label: "Skill name" } },
  {
    key: "number",
    within: ["footer", "skills"],
    doc: { label: "Order number", hint: 'Two digits, e.g. "01".' },
  },
  { key: "exploreHeading", doc: { label: '"Explore" heading' } },
  { key: "selectedWorkLabel", doc: { label: '"Selected work" footer link' } },
  { key: "photoboothLabel", doc: { label: '"Photobooth" footer link' } },
  { key: "experienceLabel", doc: { label: '"Experience" footer link' } },
  { key: "contactHeading", doc: { label: '"Get in touch" footer heading' } },
  { key: "copyrightPrefix", doc: { label: "Copyright symbol" } },
  { key: "closingLine", doc: { label: "Closing line", hint: "The last line of the footer." } },

  /* ---------- Shared ---------- */
  {
    key: "heading",
    doc: { label: "Section heading", hint: "The large title at the top of this section." },
  },
  { key: "intro", doc: { label: "Intro paragraph", hint: "The paragraph under the heading." } },
  { key: "title", doc: { label: "Title" } },
  { key: "location", doc: { label: "Your city" } },
  {
    key: "initials",
    doc: {
      label: "Initials",
      hint: "Shown in place of a photo when none is set. Two to four letters.",
    },
  },
  {
    key: "url",
    doc: {
      label: "Media URL",
      hint: "Filled in automatically after an upload. Paste an address to use a file hosted elsewhere.",
    },
  },
  {
    key: "alt",
    doc: {
      label: "Alt text",
      hint: "Describe the picture for screen readers, and for when the image fails to load.",
    },
  },
  {
    key: "id",
    doc: {
      label: "Internal ID",
      hint: "A reference the site uses to track this entry. Leave it alone unless you know why you are changing it.",
    },
  },
];

const ruleIndex = fieldRules.reduce<Map<string, FieldRule[]>>((map, rule) => {
  const existing = map.get(rule.key);
  if (existing) existing.push(rule);
  else map.set(rule.key, [rule]);
  return map;
}, new Map());

function singular(label: string) {
  return label.endsWith("s") ? label.slice(0, -1) : label;
}

export function describeField(path: readonly (string | number)[]): FieldDoc {
  const last = path.at(-1);

  if (typeof last === "number") {
    const parent = describeField(path.slice(0, -1));
    return { label: `${parent.itemLabel ?? singular(parent.label)} ${last + 1}` };
  }

  const key = String(last ?? "");
  const segments = path.filter((segment): segment is string => typeof segment === "string");

  for (const rule of ruleIndex.get(key) ?? []) {
    if (rule.within && !rule.within.every((ancestor) => segments.includes(ancestor))) continue;
    return rule.doc;
  }

  return { label: labelFor(key) };
}

export function fieldLabel(path: readonly (string | number)[]) {
  return describeField(path).label;
}
