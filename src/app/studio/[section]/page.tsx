import { notFound } from "next/navigation";
import { SectionEditor } from "@/components/studio/SectionEditor";
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
  const data = await getStudioDraft(sectionKey);
  const uploadEnabled = await isMediaUploadConfigured();

  return (
    <SectionEditor
      key={sectionKey}
      section={sectionKey}
      data={data}
      uploadEnabled={uploadEnabled}
    />
  );
}
