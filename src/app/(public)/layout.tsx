import { cookies } from "next/headers";
import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/public/Footer";
import { Nav } from "@/components/public/Nav";
import { getContact, getSettings } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";
import { defaultSiteSettings } from "@/schemas/settings";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

function getTheme(value: string | undefined, defaultTheme: "suite" | "sheet" | "system") {
  if (value === "light" || value === "dark") return value;
  return defaultTheme === "sheet" ? "light" : "dark";
}

export const viewport: Viewport = {
  themeColor: "#050505",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = getSiteUrl(settings.domain);

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
      ...(settings.seo.ogImage ? { images: [settings.seo.ogImage] } : {}),
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
