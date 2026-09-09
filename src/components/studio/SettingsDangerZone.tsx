"use client";

import { useCallback, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/actions/account";
import { getUnusedMedia, purgeUnusedMedia } from "@/actions/media";
import { revertDraftsToPublished } from "@/actions/publish";
import type { UnusedMediaSummary } from "@/actions/media-types";
import { useStudioStore, useUploadBlock } from "@/stores/studio-store";

function formatBytes(bytes: number) {
  if (bytes <= 0) return "unknown size";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function SettingsDangerZone() {
  const router = useRouter();
  const pushToast = useStudioStore((state) => state.pushToast);
  const dirtySection = useStudioStore((state) => state.dirtySection);
  const { blocked: uploadBlocked } = useUploadBlock();
  const [isReverting, startTransition] = useTransition();
  const [unused, setUnused] = useState<UnusedMediaSummary | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const revertDrafts = () => {
    if (!window.confirm("Replace every draft with the last published version?")) return;

    startTransition(async () => {
      const result = await revertDraftsToPublished();
      if (!result.ok) {
        pushToast(result.error, "error");
        return;
      }
      pushToast("Drafts reverted to the last published site", "success");
      // router.refresh() re-renders in place without remounting the open SectionEditor,
      // which would keep serving its pre-revert draft version and content - a full
      // reload re-fetches everything from scratch instead.
      window.location.reload();
    });
  };

  /* Asked for rather than run on load: this reads every section's JSON to work
     out what is referenced, which is not worth doing on every visit to Settings
     for a panel that is usually just passed over. */
  const checkUnused = useCallback(async () => {
    setIsChecking(true);
    const result = await getUnusedMedia();
    setIsChecking(false);
    if (!result.ok) {
      pushToast(result.error, "error");
      return;
    }
    setUnused(result.summary);
  }, [pushToast]);

  const removeUnused = async () => {
    if (!unused || unused.count === 0 || isSweeping) return;
    if (
      !window.confirm(
        `Permanently delete ${unused.count} unused upload${unused.count === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setIsSweeping(true);
    const result = await purgeUnusedMedia();
    setIsSweeping(false);

    if (!result.ok) {
      pushToast(result.error, "error");
      return;
    }
    pushToast(
      result.failed > 0
        ? `Removed ${result.deleted} unused upload${result.deleted === 1 ? "" : "s"} - ${result.failed} could not be removed and will be retried.`
        : `Removed ${result.deleted} unused upload${result.deleted === 1 ? "" : "s"}`,
      result.failed > 0 ? "info" : "success",
    );
    await checkUnused();
    router.refresh();
  };

  const submitPasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    setIsChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);
    if (!result.ok) {
      pushToast(result.error, "error");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    pushToast("Password changed", "success");
  };

  return (
    <>
      <section className="studio-account-card" aria-labelledby="password-title">
        <div>
          <span className="slate">Account</span>
          <h2 id="password-title">Change password</h2>
          <p>Update the password used to sign in to the Studio.</p>
        </div>
        <form onSubmit={submitPasswordChange} className="studio-account-card__form">
          <label className="studio-field" htmlFor="current-password">
            <span>Current password</span>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="studio-field" htmlFor="new-password">
            <span>New password</span>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="button button--primary"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? "Changing..." : "Change password"}
          </button>
        </form>
      </section>

      <section className="studio-danger-zone" aria-labelledby="danger-zone-title">
        <div>
          <span className="slate">Danger zone</span>
          <h2 id="danger-zone-title">Revert drafts</h2>
          <p>Replace all drafts with the content currently live on the site.</p>
        </div>
        <button
          type="button"
          className="studio-danger-zone__button"
          onClick={revertDrafts}
          disabled={isReverting || Boolean(dirtySection) || uploadBlocked}
        >
          {isReverting ? "Reverting..." : "Revert to last published"}
        </button>
      </section>

      <section className="studio-danger-zone" aria-labelledby="unused-media-title">
        <div>
          <span className="slate">Storage</span>
          <h2 id="unused-media-title">Unused uploads</h2>
          <p>
            {unused === null
              ? "Uploads stay in storage even when nothing points at them - an abandoned draft, or a photo that was later replaced. Check for any that no draft and no published section uses."
              : unused.count === 0
                ? "Every stored file is used by a draft or by the live site."
                : `${unused.count} file${unused.count === 1 ? "" : "s"} (${formatBytes(unused.bytes)}) ${unused.count === 1 ? "is" : "are"} stored but used by no draft and by no published section. Files added in the last day are left alone, so anything uploaded but not yet saved is safe.`}
          </p>
        </div>
        {unused === null || unused.count === 0 ? (
          <button
            type="button"
            className="studio-danger-zone__button"
            onClick={() => void checkUnused()}
            disabled={isChecking || uploadBlocked}
          >
            {isChecking ? "Checking..." : "Check for unused files"}
          </button>
        ) : (
          <button
            type="button"
            className="studio-danger-zone__button"
            onClick={() => void removeUnused()}
            disabled={isSweeping || uploadBlocked}
          >
            {isSweeping
              ? "Removing..."
              : `Remove ${unused.count} unused file${unused.count === 1 ? "" : "s"}`}
          </button>
        )}
      </section>
    </>
  );
}
