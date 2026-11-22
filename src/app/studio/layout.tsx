import { requireOwnerOrSignIn } from "@/auth";
import { StudioShell } from "@/components/studio/StudioShell";
import { getStudioShellData } from "@/lib/studio";

type StudioLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function StudioLayout({ children }: StudioLayoutProps) {
  // The owner check is its own DB round trip; running it beside the shell read instead of
  // before it saves one. A failed check still redirects before anything renders. Middleware only
  // checks the cookie's signature, so a session ended by logout or a password change lands here.
  const [, shellData] = await Promise.all([requireOwnerOrSignIn(), getStudioShellData()]);

  return (
    <StudioShell shellData={shellData} publicSiteUrl={process.env.PUBLIC_SITE_URL || "/"}>
      {children}
    </StudioShell>
  );
}
