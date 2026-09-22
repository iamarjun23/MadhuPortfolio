import type { Metadata } from "next";
import { MoodBoard } from "@/components/public/MoodBoard";
import { getContact, getRoom, getSettings } from "@/lib/content";
import { realImage } from "@/lib/placeholders";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const description = `A visual sketchbook from ${settings.seo.title}.`;
  const shareImage = realImage(settings.seo.ogImage);

  return {
    title: "The Drawing Room",
    description,
    openGraph: {
      title: `The Drawing Room | ${settings.seo.title}`,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}

export default async function DrawingRoomPage() {
  const [room, settings, contact] = await Promise.all([getRoom(), getSettings(), getContact()]);
  return <MoodBoard data={room} fallbackImage={settings.fallbackImage} contact={contact} />;
}
