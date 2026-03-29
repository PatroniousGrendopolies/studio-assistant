import { notFound } from "next/navigation";
import { getAvailableRooms } from "@/lib/content";

export default async function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rooms = getAvailableRooms();

  if (!rooms.includes(id)) {
    notFound();
  }

  return <>{children}</>;
}
