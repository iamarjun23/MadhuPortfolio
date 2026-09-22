"use client";

import { AboutBlock } from "@/components/public/AboutBlock";
import { ClientsMarquee } from "@/components/public/ClientsMarquee";
import { ContactBlock } from "@/components/public/ContactBlock";
import { DrawingRoomTeaser } from "@/components/public/DrawingRoomTeaser";
import { Experience } from "@/components/public/Experience";
import { Footer } from "@/components/public/Footer";
import { Hero } from "@/components/public/Hero";
import { ImpactStrip } from "@/components/public/ImpactStrip";
import { MoodBoard } from "@/components/public/MoodBoard";
import { Nav } from "@/components/public/Nav";
import { ResumePage } from "@/components/public/ResumePage";
import { Testimonials } from "@/components/public/Testimonials";
import { WorkConsole } from "@/components/public/WorkConsole";
import type { SectionKey } from "@/lib/sections";
import {
  AboutSchema,
  ClientsSchema,
  ContactSchema,
  ExperienceSchema,
  HeroSchema,
  ImpactSchema,
  PraiseSchema,
  ResumeSchema,
  RoomSchema,
  SettingsSchema,
  WorkSchema,
} from "@/schemas";

type StudioLandingPreviewProps = Readonly<{
  section: SectionKey;
  data: unknown;
  contactData: unknown;
  settingsData: unknown;
  onWorkProjectSelect?: (laneLabel: string, projectId: string) => void;
  onWorkProjectMove?: (
    laneLabel: string,
    projectId: string,
    position: { x: number; y: number } | null,
  ) => void;
  onWorkProjectReorder?: (laneLabel: string | null, fromId: string, toId: string) => void;
  onCollaboratorSelect?: (index: number) => void;
  onCollaboratorMove?: (from: number, to: number) => void;
}>;

function PreviewUnavailable() {
  return (
    <div className="studio-live-preview__unavailable" role="status">
      Finish the required fields to resume this page preview.
    </div>
  );
}

export function StudioLandingPreview({
  section,
  data,
  contactData,
  settingsData,
  onWorkProjectSelect,
  onWorkProjectMove,
  onWorkProjectReorder,
  onCollaboratorSelect,
  onCollaboratorMove,
}: StudioLandingPreviewProps) {
  /* The stand-in photo is a site-wide setting, so the preview reads it from
     there rather than from the section being edited - the same way the page
     does. Anything unparseable simply means no stand-in. */
  const fallbackImage = SettingsSchema.safeParse(settingsData).data?.fallbackImage ?? null;

  switch (section) {
    case "hero": {
      const parsed = HeroSchema.safeParse(data);
      return parsed.success ? <Hero data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "about": {
      const parsed = AboutSchema.safeParse(data);
      return parsed.success ? (
        <AboutBlock data={parsed.data} fallbackImage={fallbackImage} />
      ) : (
        <PreviewUnavailable />
      );
    }
    case "impact": {
      const parsed = ImpactSchema.safeParse(data);
      return parsed.success ? (
        <ImpactStrip
          data={parsed.data}
          onSelectCollaborator={onCollaboratorSelect}
          onMoveCollaborator={onCollaboratorMove}
        />
      ) : (
        <PreviewUnavailable />
      );
    }
    case "clients": {
      const parsed = ClientsSchema.safeParse(data);
      return parsed.success ? <ClientsMarquee data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "work": {
      const parsed = WorkSchema.safeParse(data);
      const contact = ContactSchema.safeParse(contactData);
      return parsed.success && contact.success ? (
        <WorkConsole
          data={parsed.data}
          contactEmail={contact.data.email}
          interactive={false}
          onSelectProject={onWorkProjectSelect}
          onMoveProject={onWorkProjectMove}
          onReorderProjects={onWorkProjectReorder}
        />
      ) : (
        <PreviewUnavailable />
      );
    }
    case "praise": {
      const parsed = PraiseSchema.safeParse(data);
      return parsed.success ? <Testimonials data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "experience": {
      const parsed = ExperienceSchema.safeParse(data);
      return parsed.success ? (
        <Experience data={parsed.data} fallbackImage={fallbackImage} autoPlay={false} />
      ) : (
        <PreviewUnavailable />
      );
    }
    case "resume": {
      const parsed = ResumeSchema.safeParse(data);
      return parsed.success ? <ResumePage data={parsed.data} /> : <PreviewUnavailable />;
    }
    case "room": {
      const parsed = RoomSchema.safeParse(data);
      const contact = ContactSchema.safeParse(contactData);
      if (!parsed.success || !contact.success) return <PreviewUnavailable />;

      // The teaser lives on the home page, the pinboard on its own /room page - two
      // different places a visitor sees this section. Both run here, stacked, so a
      // field like the teaser's invitation photo has somewhere to show up at all.
      return (
        <div className="studio-room-preview">
          <DrawingRoomTeaser data={parsed.data} />
          <p className="studio-room-preview__divider">The Drawing Room page (/room)</p>
          <MoodBoard data={parsed.data} fallbackImage={fallbackImage} contact={contact.data} />
        </div>
      );
    }
    case "contact": {
      const parsed = ContactSchema.safeParse(data);
      return parsed.success ? <ContactBlock contact={parsed.data} /> : <PreviewUnavailable />;
    }
    case "settings": {
      const parsed = SettingsSchema.safeParse(data);
      const contact = ContactSchema.safeParse(contactData);
      if (!parsed.success || !contact.success) return <PreviewUnavailable />;

      return (
        <div className="studio-settings-preview">
          <Nav contact={contact.data} settings={parsed.data} />
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
