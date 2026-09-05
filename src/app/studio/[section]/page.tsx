import { notFound } from "next/navigation";
import { Status } from "@/generated/prisma/client";
import { SectionEditor } from "@/components/studio/SectionEditor";
import { getContact } from "@/lib/content";
import { sectionKeys } from "@/lib/sections";
import { getStudioDraft } from "@/lib/studio-drafts";
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
  const [data, contact, uploadEnabled] = await Promise.all([
    getStudioDraft(sectionKey),
    getContact(Status.DRAFT),
    isMediaUploadConfigured(),
  ]);

  return (
    <SectionEditor
      key={sectionKey}
      section={sectionKey}
      data={data}
      uploadEnabled={uploadEnabled}
      contactData={contact}
    />
  );
}
