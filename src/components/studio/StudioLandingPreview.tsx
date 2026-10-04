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
  /** Which of the Drawing Room's two places to show: its home-page invitation or the /room page. */
  roomView?: "entrance" | "page";
  /** Which part of the site-wide settings to show: the navbar alone, the footer alone, or both. */
  settingsView?: "navigation" | "footer" | "all";
  /** The draft resume PDF, so the navbar preview shows its Resume link only when the site would. */
  resumeUrl?: string | null;
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
  roomView = "page",
  settingsView = "all",
  resumeUrl,
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
      return parsed.success ? (
        <ClientsMarquee data={parsed.data} editable />
      ) : (
        <PreviewUnavailable />
      );
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
        <Experience data={parsed.data} fallbackImage={fallbackImage} autoPlay={false} editable />
      ) : (
        <PreviewUnavailable />
      );
    }
    case "resume": {
      const url = ResumeSchema.safeParse(data).data?.pdf?.url;
      // The browser's own PDF viewer, without its toolbar, fitted to the frame's width.
      return url ? (
        <iframe
          className="studio-resume-preview"
          src={`${url}#toolbar=0&view=FitH`}
          title="Resume PDF preview"
        />
      ) : (
        <div className="studio-live-preview__unavailable" role="status">
          No resume PDF yet - the menu hides its Resume link until one is uploaded.
        </div>
      );
    }
    case "room": {
      const parsed = RoomSchema.safeParse(data);
      const contact = ContactSchema.safeParse(contactData);
      if (!parsed.success || !contact.success) return <PreviewUnavailable />;

      // The teaser lives on the home page, the pinboard on its own /room page - two
      // different places a visitor sees this section, so each is previewed on its own.
      return roomView === "entrance" ? (
        <DrawingRoomTeaser data={parsed.data} />
      ) : (
        <MoodBoard data={parsed.data} fallbackImage={fallbackImage} contact={contact.data} />
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

      // The bar changes its caption on the Drawing Room page, so both versions are shown.
      if (settingsView === "navigation") {
        return (
          <div className="studio-settings-preview studio-settings-preview--part">
            <p className="studio-settings-preview__label">On the home page</p>
            <Nav contact={contact.data} settings={parsed.data} resumeUrl={resumeUrl} />
            <p className="studio-settings-preview__label">On the Drawing Room page</p>
            <Nav
              contact={contact.data}
              settings={parsed.data}
              resumeUrl={resumeUrl}
              previewPath="/room"
            />
          </div>
        );
      }

      if (settingsView === "footer") {
        return (
          <div className="studio-settings-preview studio-settings-preview--part">
            <Footer contact={contact.data} settings={parsed.data} />
          </div>
        );
      }

      return (
        <div className="studio-settings-preview">
          <Nav contact={contact.data} settings={parsed.data} resumeUrl={resumeUrl} />
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
