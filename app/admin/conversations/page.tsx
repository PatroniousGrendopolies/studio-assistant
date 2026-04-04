import Link from "next/link";
import { getStats, listConversations } from "@/lib/db";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room } = await searchParams;
  const [stats, conversations] = await Promise.all([
    getStats(),
    listConversations(room ? { roomId: room } : undefined),
  ]);

  const statCards = [
    { label: "Total Conversations", value: stats.totalConversations },
    { label: "Today", value: stats.todayConversations },
    { label: "Open Flags", value: stats.openFlags },
    { label: "Active Corrections", value: stats.activeCorrections },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 px-4 py-3"
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter indicator */}
      {room && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <span>Filtered by room:</span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs">
            {room}
          </span>
          <Link href="/admin/conversations" className="text-black underline">
            Clear
          </Link>
        </div>
      )}

      {/* Conversations table */}
      {conversations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
          No conversations yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Room</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Started
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Messages
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Flagged
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/conversations/${conv.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {conv.room_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(conv.started_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {conv.message_count}
                  </td>
                  <td className="px-4 py-3">
                    {conv.has_flags && (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
