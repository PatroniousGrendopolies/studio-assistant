import Link from "next/link";
import { getAvailableRooms, loadRoom } from "@/lib/content.ts";

function extractRoomInfo(overview: string): {
  name: string;
  description: string;
} {
  const lines = overview.split("\n").filter((l) => l.trim() !== "");
  const headingLine = lines.find((l) => l.startsWith("# "));
  const name = headingLine ? headingLine.replace(/^#\s+/, "") : "Unknown Room";

  // First paragraph after heading
  const headingIndex = lines.indexOf(headingLine ?? "");
  const descLine = lines
    .slice(headingIndex + 1)
    .find((l) => !l.startsWith("#") && !l.startsWith("-") && l.trim() !== "");
  const description = descLine?.trim() ?? "";

  return { name, description };
}

export default function HomePage() {
  const roomIds = getAvailableRooms();
  const rooms = roomIds.map((id) => {
    const room = loadRoom(id);
    const { name, description } = extractRoomInfo(room.overview);
    return { id, name, description };
  });

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-lg px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-black">
            AUTOLAND
          </h1>
          <p className="mt-2 text-base text-[#303133]">
            Select your room to get started
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100"
            >
              <h2 className="text-lg font-semibold text-black">{room.name}</h2>
              {room.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-[#303133]">
                  {room.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
