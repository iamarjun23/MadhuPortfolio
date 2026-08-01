import { cookies } from "next/headers";
import { Footer } from "@/components/public/Footer";
import { Nav } from "@/components/public/Nav";
import { getContact, getSettings } from "@/lib/content";
import type { Contact } from "@/schemas";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

function getTheme(value: string | undefined) {
  return value === "light" ? "light" : "dark";
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const cookieStore = await cookies();
  let contact: Contact | null = null;
  let showThemeToggle = true;

  if (process.env.DATABASE_URL) {
    const [storedContact, settings] = await Promise.all([getContact(), getSettings()]);
    contact = storedContact;
    showThemeToggle = settings.appearance.showThemeToggle;
  }

  return (
    <>
      <Nav
        contact={contact}
        initialTheme={getTheme(cookieStore.get("theme")?.value)}
        showThemeToggle={showThemeToggle}
      />
      {children}
      <Footer contact={contact} />
    </>
  );
}
