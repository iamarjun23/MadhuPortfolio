"use client";

import { AboutBlock } from "@/components/public/AboutBlock";
import { ContactBlock } from "@/components/public/ContactBlock";
import { Experience } from "@/components/public/Experience";
import { Footer } from "@/components/public/Footer";
import { Hero } from "@/components/public/Hero";
import { ImpactStrip } from "@/components/public/ImpactStrip";
import { MoodBoard } from "@/components/public/MoodBoard";
import { Nav } from "@/components/public/Nav";
import { Photobooth } from "@/components/public/Photobooth";
import { Testimonials } from "@/components/public/Testimonials";
import { WorkConsole } from "@/components/public/WorkConsole";
import type { SectionKey } from "@/lib/sections";
import {
  AboutSchema,
  BoothSchema,
  ContactSchema,
  ExperienceSchema,
  HeroSchema,
  ImpactSchema,
  PraiseSchema,
  RoomSchema,
  SettingsSchema,
  WorkSchema,
} from "@/schemas";

type StudioLandingPreviewProps = Readonly<{
  section: SectionKey;
  data: unknown;
  contactData: unknown;
}>;

function PreviewUnavailable() {
  return (
    <div className="studio-live-preview__unavailable" role="status">
      Finish the required fields to resume this page preview.
    </div>
  );
}

export function StudioLandingPreview({ section, data, contactData }: StudioLandingPreviewProps) {
  switch (section) {
    case "hero": {
      const parsed = HeroSchema.safeParse(data);
      return parsed.success ? <Hero data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "about": {
      const parsed = AboutSchema.safeParse(data);
      return parsed.success ? <AboutBlock data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "impact": {
      const parsed = ImpactSchema.safeParse(data);
      return parsed.success ? <ImpactStrip data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "work": {
      const parsed = WorkSchema.safeParse(data);
      const contact = ContactSchema.safeParse(contactData);
      return parsed.success && contact.success ? (
        <WorkConsole data={parsed.data} contactEmail={contact.data.email} />
      ) : (
        <PreviewUnavailable />
      );
    }
    case "booth": {
      const parsed = BoothSchema.safeParse(data);
      return parsed.success ? <Photobooth data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "praise": {
      const parsed = PraiseSchema.safeParse(data);
      return parsed.success ? <Testimonials data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "experience": {
      const parsed = ExperienceSchema.safeParse(data);
      return parsed.success ? <Experience data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "room": {
      const parsed = RoomSchema.safeParse(data);
      return parsed.success ? <MoodBoard data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "contact": {
      const parsed = ContactSchema.safeParse(data);
      return parsed.success ? <ContactBlock contact={parsed.data} /> : <PreviewUnavailable />;
    }
    case "settings": {
      const parsed = SettingsSchema.safeParse(data);
      const contact = ContactSchema.safeParse(contactData);
      if (!parsed.success || !contact.success) return <PreviewUnavailable />;

      const initialTheme = parsed.data.appearance.defaultTheme === "sheet" ? "light" : "dark";
      return (
        <div className="studio-settings-preview">
          <Nav
            contact={contact.data}
            settings={parsed.data}
            initialTheme={initialTheme}
            showThemeToggle={parsed.data.appearance.showThemeToggle}
          />
          <div className="studio-settings-preview__middle">
            <span>Page content</span>
            <p>Navigation above · footer below</p>
          </div>
          <Footer contact={contact.data} settings={parsed.data} />
        </div>
      );
    }
  }
}
