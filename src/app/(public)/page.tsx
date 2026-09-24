import type { Metadata } from "next";
import { AboutBlock } from "@/components/public/AboutBlock";
import { ClientsMarquee } from "@/components/public/ClientsMarquee";
import { ContactBlock } from "@/components/public/ContactBlock";
import { DrawingRoomTeaser } from "@/components/public/DrawingRoomTeaser";
import { Experience } from "@/components/public/Experience";
import { Hero } from "@/components/public/Hero";
import { ImpactStrip } from "@/components/public/ImpactStrip";
import { Testimonials } from "@/components/public/Testimonials";
import { WorkConsole } from "@/components/public/WorkConsole";
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

  return (
    <main id="top" className="landing">
      <a href="#work" className="skip">
        {settings.site?.navigation?.skipLinkLabel ?? defaultSiteSettings.navigation.skipLinkLabel}
      </a>
      <Hero data={hero} />
      <AboutBlock data={about} fallbackImage={settings.fallbackImage} />
      <ImpactStrip data={impact} />
      <ClientsMarquee data={clients} />
      <WorkConsole data={work} contactEmail={contact.email} />
      <Testimonials data={praise} />
      <Experience data={experience} fallbackImage={settings.fallbackImage} />
      <DrawingRoomTeaser data={room} />
      <ContactBlock contact={contact} />
    </main>
  );
}
