import { cookies } from "next/headers";
import { requireOwner } from "@/auth";
import { StudioShell } from "@/components/studio/StudioShell";
import { getStudioShellData } from "@/lib/studio";

type StudioLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

function getTheme(value: string | undefined): "dark" | "light" {
  return value === "light" ? "light" : "dark";
}

export default async function StudioLayout({ children }: StudioLayoutProps) {
  // The owner check is its own DB round trip; running it beside the shell reads instead of
  // before them saves one. A failed check still throws before anything renders.
  const [, cookieStore, shellData] = await Promise.all([
    requireOwner(),
    cookies(),
    getStudioShellData(),
  ]);

  return (
    <StudioShell
      initialTheme={getTheme(cookieStore.get("theme")?.value)}
      shellData={shellData}
      publicSiteUrl={process.env.PUBLIC_SITE_URL || "/"}
    >
      {children}
    </StudioShell>
  );
}
