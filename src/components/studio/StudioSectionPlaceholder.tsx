import type { SectionKey } from "@/lib/sections";
import { studioSectionLabels } from "@/lib/studio-nav";

type StudioSectionPlaceholderProps = Readonly<{
  section: SectionKey;
}>;

export function StudioSectionPlaceholder({ section }: StudioSectionPlaceholderProps) {
  const label = studioSectionLabels[section];

  return (
    <section className="studio-page" aria-labelledby="studio-section-title">
      <span className="slate">Page content</span>
      <h1 id="studio-section-title">{label}</h1>
      <p>The {label.toLowerCase()} editor is being prepared for Phase 8.</p>
    </section>
  );
}
