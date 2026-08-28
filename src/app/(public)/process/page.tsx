import type { Metadata } from "next";
import { ProcessPage } from "@/components/public/ProcessPage";
import { getBooth, getSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const description = "How N Madhu Kumar organises, edits, reviews, and delivers video work.";

  return {
    title: "Studio",
    description,
    openGraph: {
      title: `Studio | ${settings.seo.title}`,
      description,
      ...(settings.seo.ogImage ? { images: [settings.seo.ogImage] } : {}),
    },
  };
}

export default async function ProcessRoute() {
  const booth = await getBooth();
  return <ProcessPage booth={booth} />;
}
