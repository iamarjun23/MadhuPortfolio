"use client";

import { useEffect } from "react";
import { Rail } from "@/components/studio/Rail";
import { Toast } from "@/components/studio/Toast";
import { Topbar } from "@/components/studio/Topbar";
import type { StudioShellData } from "@/lib/studio-nav";
import { useStudioStore, useUploadBlock } from "@/stores/studio-store";

type StudioShellProps = Readonly<{
  children: React.ReactNode;
  shellData: StudioShellData;
  publicSiteUrl: string;
}>;

export function StudioShell({ children, shellData, publicSiteUrl }: StudioShellProps) {
  const setHasUnpublishedChanges = useStudioStore((state) => state.setHasUnpublishedChanges);
  const { blocked: uploadBlocked } = useUploadBlock();

  useEffect(() => {
    setHasUnpublishedChanges(shellData.hasUnpublishedChanges);
  }, [setHasUnpublishedChanges, shellData.hasUnpublishedChanges]);

  /* The in-app guards cannot reach a tab close or a reload. Closing mid-upload
     abandons the request part-written, so the browser's own confirmation is the
     only thing left to ask with. */
  useEffect(() => {
    if (!uploadBlocked) return;
    const confirmLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [uploadBlocked]);

  return (
    <div className="studio-shell">
      <Topbar publicSiteUrl={publicSiteUrl} edited={shellData.edited} flagged={shellData.flagged}>
        <Rail edited={shellData.edited} />
      </Topbar>
      <main className="studio-main">{children}</main>
      <Toast />
    </div>
  );
}
