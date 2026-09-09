import { cookies } from "next/headers";
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

function getTheme(value: string | undefined, defaultTheme: "suite" | "sheet" | "system") {
  if (value === "light" || value === "dark") return value;
  return defaultTheme === "sheet" ? "light" : "dark";
}

// Keep the public portfolio on its 1280px artboard across phones and tablets.
// Browsers auto-fit that artboard to the device while desktop browsers continue
// to use their real viewport, preserving the responsive laptop layout.
export const viewport: Viewport = {
  themeColor: "#050505",
  width: 1280,
  viewportFit: "cover",
  userScalable: true,
  maximumScale: 5,
  // Override Next.js's implicit scale so mobile browsers can calculate the
  // correct fit for the fixed-width artboard.
  initialScale: undefined,
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
  const cookieStore = await cookies();
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
          initialTheme={getTheme(cookieStore.get("theme")?.value, settings.appearance.defaultTheme)}
          showThemeToggle={settings.appearance.showThemeToggle}
        />
        {children}
        <Footer contact={contact} settings={settings} />
      </div>
    </>
  );
}
