"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { revertDraftsToPublished } from "@/actions/publish";
import { useStudioStore } from "@/stores/studio-store";

export function SettingsDangerZone() {
  const router = useRouter();
  const pushToast = useStudioStore((state) => state.pushToast);
  const dirtySection = useStudioStore((state) => state.dirtySection);
  const [isReverting, startTransition] = useTransition();

  const revertDrafts = () => {
    if (!window.confirm("Replace every draft with the last published version?")) return;

    startTransition(async () => {
      const result = await revertDraftsToPublished();
      if (!result.ok) {
        pushToast(result.error, "error");
        return;
      }
      pushToast("Drafts reverted to the last published site", "success");
      router.refresh();
    });
  };

  return (
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
        disabled={isReverting || Boolean(dirtySection)}
      >
        {isReverting ? "Reverting..." : "Revert to last published"}
      </button>
    </section>
  );
}
