import { notFound } from "next/navigation";
import { Status } from "@/generated/prisma/client";
import { SectionEditor } from "@/components/studio/SectionEditor";
import { getContact, getSettings } from "@/lib/content";
import { sectionKeys } from "@/lib/sections";
import { getStudioDraft, getStudioDraftVersion } from "@/lib/studio-drafts";
import { isMediaUploadConfigured } from "@/lib/media-config";

type StudioSectionPageProps = Readonly<{
  params: Promise<{ section: string }>;
}>;

export default async function StudioSectionPage({ params }: StudioSectionPageProps) {
  const { section } = await params;

  if (!sectionKeys.includes(section as (typeof sectionKeys)[number])) {
    notFound();
  }

  const sectionKey = section as (typeof sectionKeys)[number];
  const [data, version, contact, settings, uploadEnabled] = await Promise.all([
    getStudioDraft(sectionKey),
    getStudioDraftVersion(sectionKey),
    getContact(Status.DRAFT),
    getSettings(Status.DRAFT),
    isMediaUploadConfigured(),
  ]);

  return (
    <SectionEditor
      key={sectionKey}
      section={sectionKey}
      data={data}
      version={version}
      uploadEnabled={uploadEnabled}
      contactData={contact}
      settingsData={settings}
    />
  );
}
