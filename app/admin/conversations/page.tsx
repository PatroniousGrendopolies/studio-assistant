import Link from "next/link";
import { getStats, listConversations } from "@/lib/db";

function formatDuration(startedAt: string, lastMessageAt: string | null): string {
  if (!lastMessageAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(lastMessageAt).getTime();
  const diffMs = end - start;
  if (diffMs < 1000) return "<1s";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  const remainMin = diffMin % 60;
  return `${diffHr}h ${remainMin}m`;
}

export default async function ConversationsPage() {
  const [stats, conversations] = await Promise.all([
    getStats(),
    listConversations(),
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
                <th className="px-4 py-3 font-medium text-gray-600">Topic</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Started
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Length
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
                      className="text-black hover:underline"
                    >
                      {conv.topic || "Untitled conversation"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(conv.started_at).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDuration(conv.started_at, conv.last_message_at)}
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
