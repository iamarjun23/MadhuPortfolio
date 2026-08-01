import { AboutBlock } from "@/components/public/AboutBlock";
import { ContactBlock } from "@/components/public/ContactBlock";
import { DrawingRoomTeaser } from "@/components/public/DrawingRoomTeaser";
import { Experience } from "@/components/public/Experience";
import { Hero } from "@/components/public/Hero";
import { ImpactStrip } from "@/components/public/ImpactStrip";
import { Photobooth } from "@/components/public/Photobooth";
import { Testimonials } from "@/components/public/Testimonials";
import { WorkConsole } from "@/components/public/WorkConsole";
import {
  getAbout,
  getBooth,
  getContact,
  getExperience,
  getHero,
  getImpact,
  getPraise,
  getWork,
} from "@/lib/content";

export default async function PortfolioPage() {
  const [hero, about, impact, work, booth, praise, experience, contact] = await Promise.all([
    getHero(),
    getAbout(),
    getImpact(),
    getWork(),
    getBooth(),
    getPraise(),
    getExperience(),
    getContact(),
  ]);

  return (
    <main id="top">
      <a href="#work" className="skip">
        Skip to the work
      </a>
      <Hero data={hero} />
      <AboutBlock data={about} />
      <ImpactStrip data={impact} />
      <WorkConsole data={work} contactEmail={contact.email} />
      <Photobooth data={booth} />
      <Testimonials data={praise} />
      <Experience data={experience} />
      <DrawingRoomTeaser />
      <ContactBlock contact={contact} />
    </main>
  );
}
