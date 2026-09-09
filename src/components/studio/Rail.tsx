"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { studioNavGroups, studioSectionLabels, type StudioBadgeCounts } from "@/lib/studio-nav";
import { useStudioStore, useUploadBlock } from "@/stores/studio-store";

type RailProps = Readonly<{
  badges: StudioBadgeCounts;
  open: boolean;
  onClose: () => void;
}>;

function isCurrentPath(pathname: string, href: string) {
  return href === "/studio" ? pathname === href : pathname.startsWith(`${href}/`);
}

export function Rail({ badges, open, onClose }: RailProps) {
  const pathname = usePathname();
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
  const dirtyLabel = dirtySection
    ? (studioSectionLabels[dirtySection as keyof typeof studioSectionLabels] ?? dirtySection)
    : "";

  const blockedByUpload = () => {
    if (!uploadBlocked) return false;
    pushToast(`${uploadLabel} is still uploading. Wait for it to finish.`, "info");
    return true;
  };

  const leave = (href: string) => {
    setPendingHref(null);
    onClose();
    router.push(href);
  };

  const saveThenLeave = async (href: string) => {
    if (blockedByUpload()) return;
    await saveDraft();
    if (useStudioStore.getState().dirtySection) return;
    leave(href);
  };

  return (
    <aside className={`studio-rail ${open ? "is-open" : ""}`} aria-label="Studio navigation">
      <div className="studio-rail__brand">
        <Link
          className="studio-rail__home"
          href="/studio"
          onClick={(event) => {
            if (uploadBlocked) {
              event.preventDefault();
              blockedByUpload();
              return;
            }
            if (dirtySection) {
              event.preventDefault();
              setPendingHref("/studio");
              return;
            }
            onClose();
          }}
        >
          <span>madhu.edit</span>
          <small>Content studio</small>
        </Link>
        <button
          className="studio-icon-button studio-rail__close"
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <span aria-hidden="true">x</span>
        </button>
      </div>
      <nav>
        {studioNavGroups.map((group) => (
          <section className="studio-rail__group" key={group.label} aria-label={group.label}>
            <h2>
              <span>{group.label}</span>
              <b>{String(group.items.length).padStart(2, "0")}</b>
            </h2>
            <ul>
              {group.items.map((item, index) => {
                const current = isCurrentPath(pathname, item.href);
                const badge = item.badge ? badges[item.badge] : undefined;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      onClick={(event) => {
                        if (uploadBlocked && !current) {
                          event.preventDefault();
                          blockedByUpload();
                          return;
                        }
                        if (dirtySection && !current) {
                          event.preventDefault();
                          setPendingHref(item.href);
                          return;
                        }
                        onClose();
                      }}
                    >
                      <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
                      <span>
                        <strong>{item.label}</strong>
                        {item.detail ? <small>{item.detail}</small> : null}
                      </span>
                      {badge !== undefined ? <em>{badge}</em> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
      {pendingHref ? (
        <div className="studio-rail__guard" role="alertdialog" aria-label="Unsaved changes">
          <p>
            <b>{dirtyLabel}</b> has changes you have not saved. Leaving now loses them.
          </p>
          <div>
            <button
              className="studio-ins-btn"
              type="button"
              disabled={isSaving}
              onClick={() => void saveThenLeave(pendingHref)}
            >
              {isSaving ? "Saving..." : "Save, then go"}
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
              className="studio-ins-btn"
              type="button"
              disabled={isSaving}
              onClick={() => setPendingHref(null)}
            >
              Stay here
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
