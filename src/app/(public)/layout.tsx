import type { Metadata, Viewport } from "next";
import { preconnect } from "react-dom";
import { Footer } from "@/components/public/Footer";
import { Nav } from "@/components/public/Nav";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";
import { getContact, getResume, getSettings } from "@/lib/content";
import { realImage } from "@/lib/placeholders";
import { getSiteUrl } from "@/lib/site-url";
import { defaultSiteSettings } from "@/schemas/settings";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// The desktop container width (base.css's #top .wrap max-width).
const DESIGN_WIDTH = 1280;

// Below the design width the whole page is zoomed down instead of reflowing, so a
// narrow window shows the same desktop layout, just smaller. --vw is pinned to 1vw
// of the design so viewport-sized values don't shrink twice under the zoom.
// Zoom is cleared before measuring because it would otherwise scale clientWidth.
const siteScaleScript = `(() => {
  const root = document.documentElement;
  const fit = () => {
    root.style.zoom = "";
    const scale = Math.min(1, root.clientWidth / ${DESIGN_WIDTH});
    root.style.zoom = scale < 1 ? String(scale) : "";
    root.style.setProperty("--vw", scale < 1 ? "${DESIGN_WIDTH / 100}px" : "1vw");
  };
  fit();
  addEventListener("resize", fit);
})();`;

// Pinned to the design width instead of device-width, so phones render the exact
// desktop layout and the browser scales it to fit, the same as siteScaleScript
// does for a narrow desktop window.
export const viewport: Viewport = {
  themeColor: "#050505",
  width: DESIGN_WIDTH,
  // Explicit undefined (not omitted): Next.js defaults initialScale to 1 when the
  // key is absent, which would stop the browser auto-fitting the pinned
  // width to the screen. A present key overrides that default, and an
  // undefined value is then left out of the meta tag.
  initialScale: undefined,
  viewportFit: "cover",
  userScalable: true,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = getSiteUrl(settings.domain);
  const shareImage = realImage(settings.seo.ogImage);

  return {
    metadataBase: siteUrl,
    title: {
      default: settings.seo.title,
      template: `%s | ${settings.seo.title}`,
    },
    description: settings.seo.description,
    openGraph: {
      type: "website",
      title: settings.seo.title,
      description: settings.seo.description,
      url: "/",
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    /* Only the card type: X reads the title, description and image from each page's og: tags
       when the twitter: ones are absent, so the pages need nothing extra and cannot drift. */
    twitter: { card: shareImage ? "summary_large_image" : "summary" },
  };
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  // Every page's images come from these two hosts; opening the connections with the HTML
  // (React sends them as a Link header) saves the first image from each a DNS + TLS round trip.
  if (process.env.NEXT_PUBLIC_MEDIA_URL) preconnect(process.env.NEXT_PUBLIC_MEDIA_URL);
  preconnect("https://i.ytimg.com");
  const [contact, settings, resume] = await Promise.all([getContact(), getSettings(), getResume()]);
  const siteUrl = getSiteUrl(settings.domain).toString();
  const { linkedin, instagram, youtube } = contact.socials;
  const sameAs = [linkedin, instagram, youtube].filter((value): value is string => Boolean(value));
  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: settings.site?.ownerName ?? defaultSiteSettings.ownerName,
      url: siteUrl,
      email: contact.email,
      sameAs,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.seo.title,
      url: siteUrl,
    },
  ]).replace(/</g, "\\u003c");

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: siteScaleScript }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className={settings.appearance.motion ? undefined : "motion-disabled"}>
        <Nav contact={contact} settings={settings} resumeUrl={resume.pdf?.url} />
        {children}
        <Footer contact={contact} settings={settings} />
        <WhatsAppButton contact={contact} />
      </div>
    </>
  );
}
