import { MoodBoard } from "@/components/public/MoodBoard";
import { getRoom } from "@/lib/content";

export default async function DrawingRoomPage() {
  const room = await getRoom();
  return <MoodBoard data={room} />;
}
