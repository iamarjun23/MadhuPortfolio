import type { Metadata, Viewport } from "next";
import { AboutBlock } from "@/components/public/AboutBlock";
import { ClientsMarquee } from "@/components/public/ClientsMarquee";
import { ContactBlock } from "@/components/public/ContactBlock";
import { DrawingRoomTeaser } from "@/components/public/DrawingRoomTeaser";
import { Experience } from "@/components/public/Experience";
import { Hero } from "@/components/public/Hero";
import { ImpactStrip } from "@/components/public/ImpactStrip";
import { Testimonials } from "@/components/public/Testimonials";
import { WorkConsole } from "@/components/public/WorkConsole";
import { sectionTimeline } from "@/lib/section-timeline";
import { defaultSiteSettings } from "@/schemas/settings";
import {
  getAbout,
  getClients,
  getContact,
  getExperience,
  getHero,
  getImpact,
  getPraise,
  getRoom,
  getSettings,
  getWork,
} from "@/lib/content";

/* Set per page, not in the layout: the child pages would inherit a layout canonical and point
   search engines at the homepage. Resolved against the layout's metadataBase (Settings → domain). */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* The home page has a phone layout (mobile.css), so phones get their real width here
   instead of the public layout's pinned 1280px artboard. The layout's scale script
   reads this tag to know the page can be left unzoomed at phone widths. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function PortfolioPage() {
  const [hero, about, impact, clients, work, praise, experience, room, contact, settings] =
    await Promise.all([
      getHero(),
      getAbout(),
      getImpact(),
      getClients(),
      getWork(),
      getPraise(),
      getExperience(),
      getRoom(),
      getContact(),
      getSettings(),
    ]);
  // Mirrors each section's own "render nothing" check so hidden sections drop off the timeline.
  const timeline = sectionTimeline([
    ["about", true],
    ["impact", true],
    ["clients", clients.clients.length > 0],
    ["work", true],
    ["praise", praise.visible && praise.quotes.length > 0],
    ["experience", experience.roles.length > 0],
    ["room", true],
    ["contact", true],
  ]);

  return (
    <main id="top" className="landing">
      <a href="#work" className="skip">
        {settings.site?.navigation?.skipLinkLabel ?? defaultSiteSettings.navigation.skipLinkLabel}
      </a>
      <Hero data={hero} />
      <AboutBlock
        data={about}
        fallbackImage={settings.fallbackImage}
        timeline={timeline.get("about")}
      />
      <ImpactStrip data={impact} timeline={timeline.get("impact")} />
      <ClientsMarquee data={clients} timeline={timeline.get("clients")} />
      <WorkConsole data={work} contactEmail={contact.email} timeline={timeline.get("work")} />
      <Testimonials data={praise} timeline={timeline.get("praise")} />
      <Experience
        data={experience}
        fallbackImage={settings.fallbackImage}
        timeline={timeline.get("experience")}
      />
      <DrawingRoomTeaser data={room} timeline={timeline.get("room")} />
      <ContactBlock contact={contact} timeline={timeline.get("contact")} />
    </main>
  );
}
