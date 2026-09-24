"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { publishAll, retryLiveRefresh } from "@/actions/publish";
import { STUDIO_BASE, studioSectionLabels } from "@/lib/studio-nav";
import { useStudioStore, useUploadBlock } from "@/stores/studio-store";

type TopbarProps = Readonly<{
  onMenu: () => void;
  publicSiteUrl: string;
}>;

function getCrumb(pathname: string) {
  const relative = pathname.startsWith(STUDIO_BASE) ? pathname.slice(STUDIO_BASE.length) : pathname;
  const section = relative.split("/")[1];
  return section && section in studioSectionLabels
    ? studioSectionLabels[section as keyof typeof studioSectionLabels]
    : "Dashboard";
}

export function Topbar({ onMenu, publicSiteUrl }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pushToast = useStudioStore((state) => state.pushToast);
  const dirtySection = useStudioStore((state) => state.dirtySection);
  const hasUnpublishedChanges = useStudioStore((state) => state.hasUnpublishedChanges);
  const { blocked: uploadBlocked, label: uploadLabel } = useUploadBlock();
  const setHasUnpublishedChanges = useStudioStore((state) => state.setHasUnpublishedChanges);
  const [isPublishing, startTransition] = useTransition();
  const [networkAvailable, setNetworkAvailable] = useState(true);
  // Published, but the live site's cache did not clear: the button offers to retry that step.
  const [liveStale, setLiveStale] = useState(false);
  const crumb = getCrumb(pathname);
  const offerRefresh = liveStale && !hasUnpublishedChanges;

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
      setLiveStale(!result.liveRefreshed);
      if (result.liveRefreshed) {
        pushToast("Site published", "success");
      } else {
        pushToast(
          "Published, but the live site did not refresh. Use Refresh live site to retry.",
          "error",
        );
      }
      router.refresh();
    });
  };

  const refreshLive = () => {
    startTransition(async () => {
      if (await retryLiveRefresh()) {
        setLiveStale(false);
        pushToast("Live site refreshed", "success");
      } else {
        pushToast("The live site still did not refresh. Try again in a moment.", "error");
      }
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
        {!dirtySection && !hasUnpublishedChanges && !isPublishing && !offerRefresh ? (
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
        <a className="studio-view-site" href={publicSiteUrl} target="_blank" rel="noreferrer">
          View site
        </a>
        {offerRefresh ? (
          <button
            className="button button--primary studio-publish"
            type="button"
            disabled={isPublishing}
            onClick={refreshLive}
          >
            {isPublishing ? "Refreshing..." : "Refresh live site"}
          </button>
        ) : (
          <button
            className="button button--primary studio-publish"
            type="button"
            disabled={
              !hasUnpublishedChanges || Boolean(dirtySection) || isPublishing || uploadBlocked
            }
            title={uploadBlocked ? `${uploadLabel} is still uploading.` : undefined}
            onClick={publish}
          >
            {isPublishing ? "Publishing..." : uploadBlocked ? "Uploading..." : "Publish updates"}
          </button>
        )}
      </div>
    </header>
  );
}
