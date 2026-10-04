import type { SectionKey } from "@/lib/sections";
import { studioSectionLabels } from "@/lib/studio-nav";
import type { Contact, Resume, Settings, Work } from "@/schemas";
import { placeholderWhatsapp } from "@/schemas/contact";

export type PublishCheck = Readonly<{
  ok: boolean;
  label: string;
  /** The Studio path where it is fixed. */
  path: string;
}>;

type PublishCheckInput = Readonly<{
  resume: Resume;
  settings: Settings;
  work: Work;
  contact: Contact;
  /** Every draft as stored, to look through for pictures with no description. */
  drafts: ReadonlyArray<{ key: SectionKey; data: unknown }>;
}>;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// Every uploaded picture is stored as `{ url, alt }`, whichever section holds it.
function countMissingAlt(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((count, item) => count + countMissingAlt(item), 0);
  }
  if (value === null || typeof value !== "object") return 0;

  const own =
    "url" in value && "alt" in value && typeof value.alt === "string" && !value.alt.trim() ? 1 : 0;
  return own + countMissingAlt(Object.values(value));
}

/** What a visitor would notice is missing, worked out from the drafts before they go live. */
export function publishChecks({
  resume,
  settings,
  work,
  contact,
  drafts,
}: PublishCheckInput): PublishCheck[] {
  const { title, description, ogImage } = settings.seo;
  const hasSearchText = Boolean(title.trim() && description.trim());
  const silentProjects = work.lanes
    .flatMap((lane) => lane.projects)
    .filter((project) => !project.href && !project.video).length;
  const hasPlaceholderWhatsapp = contact.socials.whatsapp === placeholderWhatsapp;
  const missingAlt = drafts
    .map(({ key, data }) => ({ key, count: countMissingAlt(data) }))
    .filter(({ count }) => count > 0);

  return [
    {
      ok: Boolean(resume.pdf),
      label: resume.pdf ? "Resume PDF uploaded" : "No resume PDF, so the navbar hides Resume",
      path: "/resume",
    },
    {
      ok: hasSearchText,
      label: hasSearchText
        ? "Google title and description set"
        : "Google title or description is empty",
      path: "/settings?open=seo",
    },
    {
      ok: Boolean(ogImage),
      label: ogImage ? "Share image set" : "No share image for link previews",
      path: "/settings?open=seo",
    },
    {
      ok: silentProjects === 0,
      label:
        silentProjects === 0
          ? "Every project has a video"
          : `${plural(silentProjects, "project has", "projects have")} no video`,
      path: "/work",
    },
    {
      ok: !hasPlaceholderWhatsapp,
      label: hasPlaceholderWhatsapp
        ? "WhatsApp is still the placeholder number"
        : "WhatsApp placeholder replaced",
      path: "/contact",
    },
    ...(missingAlt.length === 0
      ? [{ ok: true, label: "Every picture has a description", path: "" }]
      : missingAlt.map(({ key, count }) => ({
          ok: false,
          label: `${studioSectionLabels[key]}: ${plural(count, "picture has", "pictures have")} no description`,
          path: `/${key}`,
        }))),
  ];
}
