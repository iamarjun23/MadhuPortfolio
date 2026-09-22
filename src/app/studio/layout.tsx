import { requireOwner } from "@/auth";
import { StudioShell } from "@/components/studio/StudioShell";
import { getStudioShellData } from "@/lib/studio";

type StudioLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function StudioLayout({ children }: StudioLayoutProps) {
  // The owner check is its own DB round trip; running it beside the shell read instead of
  // before it saves one. A failed check still throws before anything renders.
  const [, shellData] = await Promise.all([requireOwner(), getStudioShellData()]);

  return (
    <StudioShell shellData={shellData} publicSiteUrl={process.env.PUBLIC_SITE_URL || "/"}>
      {children}
    </StudioShell>
  );
}
