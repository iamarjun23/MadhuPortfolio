"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StudioDialog } from "@/components/studio/StudioDialog";
import {
  siteDetails,
  studioHome,
  studioHref,
  studioSectionLabels,
  studioTabs,
} from "@/lib/studio-nav";
import { useStudioStore, useUploadBlock } from "@/stores/studio-store";

const detailLabels: readonly string[] = siteDetails.map((item) => item.label);

type RailProps = Readonly<{
  /** The label of every tab and site detail whose saved edits are not live yet. */
  edited: readonly string[];
}>;

export function Rail({ edited }: RailProps) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = search ? `${pathname}?${search}` : pathname;
  /* The Studio page links into the settings draft (search, brand, look and domain).
     Those editors have no tab of their own, so they stay under Studio - unlike the
     navbar and footer groups of the same draft, which do. */
  const onSiteDetails =
    pathname === studioHref("/settings") && !studioTabs.some((tab) => tab.href === here);
  const router = useRouter();
  const dirtySection = useStudioStore((state) => state.dirtySection);
  const saveDraft = useStudioStore((state) => state.saveDraft);
  const isSaving = useStudioStore((state) => state.isSaving);
  /* Leaving mid-upload aborts the request, so the move is refused outright rather
     than offered as a choice - there is nothing to save first and nothing worth
     discarding. */
  const { blocked: uploadBlocked, label: uploadLabel } = useUploadBlock();
  const pushToast = useStudioStore((state) => state.pushToast);
  /* An unsaved draft only exists inside the editor that holds it, so leaving the
     page throws it away. Rather than let that happen quietly, the move is held
     here until the edits are either saved or deliberately abandoned. */
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  // Unsaved edits belong to the open editor, so they go by the name of the tab it is under.
  const dirtyLabel = dirtySection
    ? ([...studioTabs, ...siteDetails].find((item) => item.href === here)?.label ??
      studioSectionLabels[dirtySection as keyof typeof studioSectionLabels] ??
      dirtySection)
    : "";

  const leave = (href: string) => {
    setPendingHref(null);
    router.push(href);
  };

  const saveThenLeave = async (href: string) => {
    if (uploadBlocked) {
      pushToast(`${uploadLabel} is still uploading. Wait for it to finish.`, "info");
      return;
    }
    await saveDraft();
    if (useStudioStore.getState().dirtySection) return;
    leave(href);
  };

  return (
    <nav className="studio-tabs" aria-label="Sections">
      <ol>
        {studioTabs.map((tab) => {
          const home = tab.href === studioHome;
          const current = here === tab.href || (home && onSiteDetails);
          // The Studio tab answers for the site details it leads to.
          const isEdited = home
            ? edited.some((label) => detailLabels.includes(label))
            : edited.includes(tab.label);

          return (
            <li
              key={tab.href}
              className={home ? "studio-tabs__home" : tab.page ? "studio-tabs__page" : undefined}
            >
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                onClick={(event) => {
                  if (current) return;
                  if (uploadBlocked) {
                    event.preventDefault();
                    pushToast(`${uploadLabel} is still uploading. Wait for it to finish.`, "info");
                    return;
                  }
                  if (dirtySection) {
                    event.preventDefault();
                    setPendingHref(tab.href);
                  }
                }}
              >
                {tab.label}
                {isEdited ? (
                  <i className="studio-tabs__edited">
                    <span className="sr-only">, has changes that are not live</span>
                  </i>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
      {pendingHref ? (
        <StudioDialog title="Unsaved changes" onClose={() => setPendingHref(null)}>
          <p>
            <b>{dirtyLabel}</b> has changes you have not saved. Leaving now loses them.
          </p>
          <div className="studio-dialog__actions">
            <button
              className="studio-ins-btn"
              type="button"
              disabled={isSaving}
              onClick={() => setPendingHref(null)}
            >
              Stay here
            </button>
            <button
              className="studio-ins-btn studio-ins-btn--danger"
              type="button"
              disabled={isSaving}
              onClick={() => leave(pendingHref)}
            >
              Discard and go
            </button>
            <button
              className="studio-ins-btn studio-ins-btn--primary"
              type="button"
              disabled={isSaving}
              onClick={() => void saveThenLeave(pendingHref)}
            >
              {isSaving ? "Saving..." : "Save, then go"}
            </button>
          </div>
        </StudioDialog>
      ) : null}
    </nav>
  );
}
