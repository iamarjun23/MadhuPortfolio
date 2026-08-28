import { AboutBlock } from "@/components/public/AboutBlock";
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
  getContact,
  getExperience,
  getHero,
  getImpact,
  getPraise,
  getRoom,
  getSettings,
  getWork,
} from "@/lib/content";

export default async function PortfolioPage() {
  const [hero, about, impact, work, praise, experience, room, contact, settings] =
    await Promise.all([
      getHero(),
      getAbout(),
      getImpact(),
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
      <AboutBlock data={about} />
      <ImpactStrip data={impact} />
      <WorkConsole data={work} contactEmail={contact.email} />
      <Testimonials data={praise} />
      <Experience data={experience} />
      <DrawingRoomTeaser data={room} />
      <ContactBlock contact={contact} />
    </main>
  );
}
