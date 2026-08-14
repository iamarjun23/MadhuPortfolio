"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { publishAll } from "@/actions/publish";
import { ThemeToggle, type ThemeName } from "@/components/public/ThemeToggle";
import { studioSectionLabels } from "@/lib/studio-nav";
import { useStudioStore } from "@/stores/studio-store";

type TopbarProps = Readonly<{
  initialTheme: ThemeName;
  onMenu: () => void;
}>;

function getCrumb(pathname: string) {
  const section = pathname.split("/")[2];
  return section && section in studioSectionLabels
    ? studioSectionLabels[section as keyof typeof studioSectionLabels]
    : "Dashboard";
}

export function Topbar({ initialTheme, onMenu }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pushToast = useStudioStore((state) => state.pushToast);
  const dirtySection = useStudioStore((state) => state.dirtySection);
  const hasUnpublishedChanges = useStudioStore((state) => state.hasUnpublishedChanges);
  const setHasUnpublishedChanges = useStudioStore((state) => state.setHasUnpublishedChanges);
  const [isPublishing, startTransition] = useTransition();
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const crumb = getCrumb(pathname);

  useEffect(() => {
    let active = true;

    const checkNetwork = async () => {
      if (!navigator.onLine) {
        if (active) setNetworkAvailable(false);
        return;
      }

      try {
        const response = await fetch("/api/ping", { cache: "no-store" });
        if (active) setNetworkAvailable(response.ok);
      } catch {
        if (active) setNetworkAvailable(false);
      }
    };

    const markOffline = () => setNetworkAvailable(false);
    const markOnline = () => void checkNetwork();
    void checkNetwork();
    const interval = window.setInterval(() => void checkNetwork(), 30_000);
    window.addEventListener("offline", markOffline);
    window.addEventListener("online", markOnline);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("online", markOnline);
    };
  }, []);

  const publish = () => {
    startTransition(async () => {
      const result = await publishAll();
      if (!result.ok) {
        pushToast(result.error, "error");
        return;
      }
      setHasUnpublishedChanges(false);
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
        {!dirtySection && !hasUnpublishedChanges && !isPublishing ? (
          <p
            className={`studio-release-state${networkAvailable ? "" : " is-offline"}`}
            aria-live="polite"
          >
            <span className="studio-release-state__signal" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="studio-release-state__label">
              {networkAvailable ? "Ping / network" : "Ping / offline"}
            </span>
          </p>
        ) : null}
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
          {isPublishing ? "Publishing..." : "Publish updates"}
        </button>
      </div>
    </header>
  );
}
