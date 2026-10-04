"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logout } from "@/actions/account";
import { publishAll, retryLiveRefresh } from "@/actions/publish";
import { StudioDialog } from "@/components/studio/StudioDialog";
import { StudioIcon } from "@/components/studio/StudioIcon";
import { useStudioStore, useUploadBlock } from "@/stores/studio-store";

type TopbarProps = Readonly<{
  publicSiteUrl: string;
  /** The label of every tab and site detail whose saved edits are not live yet. */
  edited: readonly string[];
  /** What the publish checks still find missing. */
  flagged: readonly string[];
  /** The section tabs, which lead the bar; the actions follow them. */
  children: React.ReactNode;
}>;

export function Topbar({ publicSiteUrl, edited, flagged, children }: TopbarProps) {
  const router = useRouter();
  const pushToast = useStudioStore((state) => state.pushToast);
  const dirtySection = useStudioStore((state) => state.dirtySection);
  const hasUnpublishedChanges = useStudioStore((state) => state.hasUnpublishedChanges);
  const { blocked: uploadBlocked, label: uploadLabel } = useUploadBlock();
  const setHasUnpublishedChanges = useStudioStore((state) => state.setHasUnpublishedChanges);
  const [isPublishing, startTransition] = useTransition();
  // Published, but the live site's cache did not clear: the button offers to retry that step.
  const [liveStale, setLiveStale] = useState(false);
  const offerRefresh = liveStale && !hasUnpublishedChanges;
  // Publishing puts every saved change live at once, so it is spelled out and confirmed first.
  const [confirming, setConfirming] = useState(false);
  const state = dirtySection
    ? "Save to publish"
    : !hasUnpublishedChanges
      ? "All changes live"
      : edited.length > 0
        ? `${edited.length} not live`
        : "Changes not live";

  /* Unsaved edits live only inside the open editor, so moving away from it here
     would drop them without a word. The section tabs offer save-or-discard; logging
     out just asks for that choice to be made first. */
  const holdIfBusy = (event: React.SyntheticEvent) => {
    if (uploadBlocked) {
      event.preventDefault();
      pushToast(`${uploadLabel} is still uploading. Wait for it to finish.`, "info");
    } else if (dirtySection) {
      event.preventDefault();
      pushToast("Save or discard your changes first.", "info");
    }
  };

  const publish = () => {
    setConfirming(false);
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
      {children}
      <div className="studio-topbar__actions">
        <p className="studio-topbar__state" aria-live="polite">
          <i
            className={dirtySection || hasUnpublishedChanges ? "is-pending" : undefined}
            aria-hidden="true"
          />
          <span>{state}</span>
        </p>
        <a
          className="studio-topbar__icon"
          href={publicSiteUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="View site (opens in a new tab)"
          title="View site"
        >
          <StudioIcon name="viewSite" />
        </a>
        <form action={logout} onSubmit={holdIfBusy}>
          <button
            className="studio-topbar__icon"
            type="submit"
            aria-label="Log out"
            title="Log out"
          >
            <StudioIcon name="logOut" />
          </button>
        </form>
        {offerRefresh ? (
          <button
            className="studio-topbar__button studio-topbar__button--primary"
            type="button"
            disabled={isPublishing}
            onClick={refreshLive}
          >
            {isPublishing ? "Refreshing..." : "Refresh live site"}
          </button>
        ) : (
          <button
            className="studio-topbar__button studio-topbar__button--primary"
            type="button"
            disabled={
              !hasUnpublishedChanges || Boolean(dirtySection) || isPublishing || uploadBlocked
            }
            title={
              uploadBlocked
                ? `${uploadLabel} is still uploading.`
                : dirtySection
                  ? "Save or discard your changes first."
                  : undefined
            }
            onClick={() => setConfirming(true)}
          >
            {isPublishing ? "Publishing..." : uploadBlocked ? "Uploading..." : "Publish"}
          </button>
        )}
      </div>
      {confirming ? (
        <StudioDialog title="Publish to the live site?" onClose={() => setConfirming(false)}>
          <p>
            {edited.length > 0
              ? `Going live: ${edited.join(", ")}.`
              : "Every saved change goes live."}
          </p>
          {flagged.length > 0 ? (
            <>
              <p>Still worth a look, though none of it stops you:</p>
              <ul>
                {flagged.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="studio-dialog__actions">
            <button className="studio-ins-btn" type="button" onClick={() => setConfirming(false)}>
              Not yet
            </button>
            <button
              className="studio-ins-btn studio-ins-btn--primary"
              type="button"
              onClick={publish}
            >
              Publish
            </button>
          </div>
        </StudioDialog>
      ) : null}
    </header>
  );
}
