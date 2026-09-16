import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/public/Footer";
import { Nav } from "@/components/public/Nav";
import { getContact, getSettings } from "@/lib/content";
import { realImage } from "@/lib/placeholders";
import { getSiteUrl } from "@/lib/site-url";
import { defaultSiteSettings } from "@/schemas/settings";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// The visitor's saved theme is applied by the inline script in the root layout, before paint, and
// the toggle adopts it on mount. The server only supplies the site-wide default, because reading
// the cookie here would make every public page render per request instead of from the ISR cache.
function getDefaultTheme(defaultTheme: "suite" | "sheet" | "system") {
  return defaultTheme === "sheet" ? "light" : "dark";
}

// Pinned to the desktop container width (see base.css's 1280px max-width) instead
// of device-width, so phones render the exact desktop layout and the browser
// scales it to fit rather than the CSS reflowing into separate mobile rules.
export const viewport: Viewport = {
  themeColor: "#050505",
  width: 1280,
  // Explicit null (not omitted): Next.js defaults initialScale to 1 when the
  // key is absent, which would stop the browser auto-fitting the pinned
  // width to the screen. Only an explicit null/undefined suppresses it.
  initialScale: null as unknown as undefined,
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
  };
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const [contact, settings] = await Promise.all([getContact(), getSettings()]);
  const siteUrl = getSiteUrl(settings.domain).toString();
  const sameAs = Object.values(contact.socials).filter((value): value is string => Boolean(value));
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className={settings.appearance.motion ? undefined : "motion-disabled"}>
        <Nav
          contact={contact}
          settings={settings}
          initialTheme={getDefaultTheme(settings.appearance.defaultTheme)}
          showThemeToggle={settings.appearance.showThemeToggle}
        />
        {children}
        <Footer contact={contact} settings={settings} />
      </div>
    </>
  );
}
