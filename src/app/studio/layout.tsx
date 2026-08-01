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
  await requireOwner();
  const [cookieStore, shellData] = await Promise.all([cookies(), getStudioShellData()]);

  return (
    <StudioShell initialTheme={getTheme(cookieStore.get("theme")?.value)} shellData={shellData}>
      {children}
    </StudioShell>
  );
}
