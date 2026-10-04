"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveDraft } from "@/actions/save-draft";
import type { Contact } from "@/schemas/contact";
import { useStudioStore } from "@/stores/studio-store";

type AvailabilityCardProps = Readonly<{
  contact: Contact;
  version: string | null;
}>;

/* The freelance switch belongs to the contact draft, but it is the one contact
   setting that changes week to week, so its only switch is here: on, the
   site shows its "Available for freelance" badge in the navbar, the contact
   section and the footer; off, it hides it. It saves the draft straight away; the
   live site follows on the next publish. */
export function AvailabilityCard({ contact, version }: AvailabilityCardProps) {
  const router = useRouter();
  const pushToast = useStudioStore((state) => state.pushToast);
  const setHasUnpublishedChanges = useStudioStore((state) => state.setHasUnpublishedChanges);
  const [available, setAvailable] = useState(contact.availableForFreelance);
  // Each save hands back the draft's new version, which the next save must quote.
  const [draftVersion, setDraftVersion] = useState(version);
  const [isSaving, startTransition] = useTransition();

  const toggle = () => {
    const next = !available;
    startTransition(async () => {
      const result = await saveDraft(
        "contact",
        { ...contact, availableForFreelance: next },
        draftVersion,
      );
      if (!result.ok) {
        pushToast(result.error, "error");
        return;
      }
      setAvailable(next);
      setDraftVersion(result.version);
      setHasUnpublishedChanges(true);
      pushToast(next ? "Marked as available" : "Marked as not available", "success");
      router.refresh();
    });
  };

  return (
    <div className={`studio-settings__tile studio-availability${available ? "" : " is-off"}`}>
      <span>Available for freelance</span>
      <strong>
        <i className="studio-availability__dot" aria-hidden="true" />
        {available ? "Showing" : "Hidden"}
      </strong>
      <button
        className="studio-availability__switch"
        type="button"
        role="switch"
        aria-checked={available}
        aria-label="Available for freelance"
        disabled={isSaving}
        onClick={toggle}
      />
    </div>
  );
}
