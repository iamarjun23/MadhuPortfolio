import { notFound } from "next/navigation";
import { Status } from "@/generated/prisma/client";
import { SectionEditor } from "@/components/studio/SectionEditor";
import { getContact, getResume, getSettings } from "@/lib/content";
import { sectionKeys } from "@/lib/sections";
import { getStudioDraft, getStudioDraftVersion } from "@/lib/studio-drafts";
import { isMediaUploadConfigured } from "@/lib/media-config";

type StudioSectionPageProps = Readonly<{
  params: Promise<{ section: string }>;
  searchParams: Promise<{ open?: string | string[] }>;
}>;

export default async function StudioSectionPage({ params, searchParams }: StudioSectionPageProps) {
  const [{ section }, { open }] = await Promise.all([params, searchParams]);

  if (!sectionKeys.includes(section as (typeof sectionKeys)[number])) {
    notFound();
  }

  const sectionKey = section as (typeof sectionKeys)[number];
  // `?open=site.footer` opens the panel on that group; the editor ignores a path that doesn't exist.
  const openPath = typeof open === "string" ? open.split(".").filter(Boolean) : [];
  const [data, version, contact, settings, resume, uploadEnabled] = await Promise.all([
    getStudioDraft(sectionKey),
    getStudioDraftVersion(sectionKey),
    getContact(Status.DRAFT),
    getSettings(Status.DRAFT),
    getResume(Status.DRAFT),
    isMediaUploadConfigured(),
  ]);

  return (
    <SectionEditor
      key={`${sectionKey}:${openPath.join(".")}`}
      section={sectionKey}
      data={data}
      version={version}
      uploadEnabled={uploadEnabled}
      contactData={contact}
      settingsData={settings}
      resumeUrl={resume.pdf?.url}
      initialPath={openPath}
    />
  );
}
