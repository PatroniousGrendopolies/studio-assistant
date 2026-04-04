import Link from "next/link";
import { notFound } from "next/navigation";
import { getConversation } from "@/lib/db";
import {
  FlagForm,
  FlagActions,
} from "@/components/admin/ConversationActions";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getConversation(id);

  if (!data) notFound();

  const { conversation, messages } = data;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/conversations"
          className="text-sm text-gray-500 hover:text-black"
        >
          <svg
            className="mr-1 inline-block h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="text-sm text-gray-400">|</div>
        <div className="text-sm">
          <span className="font-mono text-xs text-gray-600">
            {conversation.room_id}
          </span>
          <span className="mx-2 text-gray-300">&middot;</span>
          <span className="text-gray-500">
            {new Date(conversation.started_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <span className="mx-2 text-gray-300">&middot;</span>
          <span className="text-gray-500">
            {conversation.message_count} messages
          </span>
        </div>
      </div>

      {/* Chat thread */}
      <div className="flex flex-col gap-3">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isFlagged = !!msg.flag && !msg.flag.resolved_at;

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%]">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-black text-white"
                      : isFlagged
                        ? "border-2 border-amber-400 bg-amber-50 text-black"
                        : "bg-[#f5f5f5] text-black"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Actions for assistant messages */}
                {!isUser && (
                  <div className="mt-1 ml-1">
                    {isFlagged && msg.flag ? (
                      <FlagActions
                        flagId={msg.flag.id}
                        flagNote={msg.flag.note}
                        messageContent={msg.content}
                        roomId={conversation.room_id}
                      />
                    ) : !msg.flag ? (
                      <FlagForm messageId={msg.id} />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
