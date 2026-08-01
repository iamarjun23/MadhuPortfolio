"use client";

import { useState } from "react";
import type { ThemeName } from "@/components/public/ThemeToggle";
import { Rail } from "@/components/studio/Rail";
import { SaveBar } from "@/components/studio/SaveBar";
import { Toast } from "@/components/studio/Toast";
import { Topbar } from "@/components/studio/Topbar";
import type { StudioShellData } from "@/lib/studio-nav";

type StudioShellProps = Readonly<{
  children: React.ReactNode;
  initialTheme: ThemeName;
  shellData: StudioShellData;
}>;

export function StudioShell({ children, initialTheme, shellData }: StudioShellProps) {
  const [railOpen, setRailOpen] = useState(false);

  return (
    <div className="studio-shell">
      <Rail badges={shellData.badges} open={railOpen} onClose={() => setRailOpen(false)} />
      <div className="studio-shell__body">
        <Topbar
          initialTheme={initialTheme}
          hasUnpublishedChanges={shellData.hasUnpublishedChanges}
          onMenu={() => setRailOpen(true)}
        />
        <main className="studio-main">{children}</main>
      </div>
      <button
        className={`studio-scrim ${railOpen ? "is-visible" : ""}`}
        type="button"
        aria-label="Close navigation"
        tabIndex={railOpen ? 0 : -1}
        onClick={() => setRailOpen(false)}
      />
      <SaveBar />
      <Toast />
    </div>
  );
}
