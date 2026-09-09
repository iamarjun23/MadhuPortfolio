import type { Metadata } from "next";
import { ProcessPage } from "@/components/public/ProcessPage";
import { getBooth, getProcess, getSettings } from "@/lib/content";
import { realImage } from "@/lib/placeholders";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, process] = await Promise.all([getSettings(), getProcess()]);
  const description = process.seo.description;
  const shareImage = realImage(settings.seo.ogImage);

  return {
    title: process.seo.title,
    description,
    openGraph: {
      title: `${process.seo.title} | ${settings.seo.title}`,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}

export default async function ProcessRoute() {
  const [data, booth, settings] = await Promise.all([getProcess(), getBooth(), getSettings()]);
  return <ProcessPage data={data} booth={booth} fallbackImage={settings.fallbackImage} />;
}
