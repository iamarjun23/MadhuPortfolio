import type { Metadata } from "next";
import { ResumePage } from "@/components/public/ResumePage";
import { getResume, getSettings } from "@/lib/content";
import { realImage } from "@/lib/placeholders";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, resume] = await Promise.all([getSettings(), getResume()]);
  const description = resume.seo.description;
  const shareImage = realImage(settings.seo.ogImage);

  return {
    title: resume.seo.title,
    description,
    openGraph: {
      title: `${resume.seo.title} | ${settings.seo.title}`,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}

export default async function ResumeRoute() {
  return <ResumePage data={await getResume()} />;
}
