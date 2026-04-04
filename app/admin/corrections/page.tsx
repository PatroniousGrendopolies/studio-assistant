import { listCorrections } from "@/lib/db";
import { getAvailableRooms } from "@/lib/content";
import {
  ActiveToggle,
  NewCorrectionForm,
} from "@/components/admin/CorrectionsActions";

export default async function CorrectionsPage() {
  const [corrections, rooms] = await Promise.all([
    listCorrections(),
    Promise.resolve(getAvailableRooms()),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Corrections</h1>
        <NewCorrectionForm rooms={rooms} />
      </div>

      {/* Corrections list */}
      {corrections.length === 0 ? (
        <div className="rounded-xl border border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
          No corrections yet. Create one to teach the assistant better responses.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {corrections.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                    {c.room_id}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <ActiveToggle correctionId={c.id} active={c.active} />
              </div>

              <div className="mb-2">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Original
                </p>
                <p className="text-sm text-gray-700">
                  {c.original_message.length > 100
                    ? c.original_message.slice(0, 100) + "..."
                    : c.original_message}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Correction
                </p>
                <p className="text-sm text-black">{c.correction}</p>
              </div>

              {c.context && (
                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium text-gray-500">
                    Context
                  </p>
                  <p className="text-xs text-gray-600">{c.context}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
