import type { Metadata } from "next";
import { MoodBoard } from "@/components/public/MoodBoard";
import { getRoom, getSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const description = `A visual sketchbook from ${settings.seo.title}.`;

  return {
    title: "The Drawing Room",
    description,
    openGraph: {
      title: `The Drawing Room | ${settings.seo.title}`,
      description,
      ...(settings.seo.ogImage ? { images: [settings.seo.ogImage] } : {}),
    },
  };
}

export default async function DrawingRoomPage() {
  const room = await getRoom();
  return <MoodBoard data={room} />;
}
