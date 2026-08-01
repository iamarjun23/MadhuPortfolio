"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { publishAll } from "@/actions/publish";
import { ThemeToggle, type ThemeName } from "@/components/public/ThemeToggle";
import { studioSectionLabels } from "@/lib/studio-nav";
import { useStudioStore } from "@/stores/studio-store";

type TopbarProps = Readonly<{
  initialTheme: ThemeName;
  hasUnpublishedChanges: boolean;
  onMenu: () => void;
}>;

function getCrumb(pathname: string) {
  const section = pathname.split("/")[2];
  return section && section in studioSectionLabels
    ? studioSectionLabels[section as keyof typeof studioSectionLabels]
    : "Dashboard";
}

export function Topbar({ initialTheme, hasUnpublishedChanges, onMenu }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pushToast = useStudioStore((state) => state.pushToast);
  const dirtySection = useStudioStore((state) => state.dirtySection);
  const [isPublishing, startTransition] = useTransition();
  const crumb = getCrumb(pathname);

  const publish = () => {
    startTransition(async () => {
      const result = await publishAll();
      if (!result.ok) {
        pushToast(result.error, "error");
        return;
      }
      pushToast("Site published", "success");
      router.refresh();
    });
  };

  return (
    <header className="studio-topbar">
      <button
        className="studio-icon-button studio-topbar__menu"
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <span className="studio-menu-icon" aria-hidden="true" />
      </button>
      <p className="studio-topbar__crumb">
        Site <span aria-hidden="true">/</span> {crumb}
      </p>
      <div className="studio-topbar__actions">
        <ThemeToggle initialTheme={initialTheme} />
        <Link className="studio-view-site" href="/" target="_blank" rel="noreferrer">
          View site
        </Link>
        <button
          className="button button--primary studio-publish"
          type="button"
          disabled={!hasUnpublishedChanges || Boolean(dirtySection) || isPublishing}
          onClick={publish}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </header>
  );
}
