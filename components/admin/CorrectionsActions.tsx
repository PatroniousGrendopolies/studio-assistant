"use client";

import { useState, useTransition } from "react";
import { toggleCorrection, createCorrection } from "@/lib/admin-actions";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// ActiveToggle — toggle a correction on/off
// ---------------------------------------------------------------------------

export function ActiveToggle({
  correctionId,
  active,
}: {
  correctionId: string;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleCorrection(correctionId, !active);
          router.refresh();
        });
      }}
      className="flex items-center gap-1.5 text-xs disabled:opacity-50"
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          active ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <span className="text-gray-600">{active ? "Active" : "Inactive"}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// NewCorrectionForm — create a correction from the corrections page
// ---------------------------------------------------------------------------

export function NewCorrectionForm({ rooms }: { rooms: string[] }) {
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState(rooms[0] ?? "");
  const [originalMessage, setOriginalMessage] = useState("");
  const [correction, setCorrection] = useState("");
  const [context, setContext] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        New Correction
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <h3 className="mb-4 text-sm font-semibold">New Correction</h3>

      <label className="mb-1 block text-xs font-medium text-gray-600">
        Room
      </label>
      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
      >
        {rooms.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-xs font-medium text-gray-600">
        Original message
      </label>
      <textarea
        value={originalMessage}
        onChange={(e) => setOriginalMessage(e.target.value)}
        rows={3}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black"
        placeholder="The response that needs correcting"
      />

      <label className="mb-1 block text-xs font-medium text-gray-600">
        Correction
      </label>
      <textarea
        value={correction}
        onChange={(e) => setCorrection(e.target.value)}
        rows={3}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black"
        placeholder="What should the assistant say instead?"
      />

      <label className="mb-1 block text-xs font-medium text-gray-600">
        Context (optional)
      </label>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        rows={2}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black"
        placeholder="When should this correction apply?"
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending || !roomId || !originalMessage.trim() || !correction.trim()}
          onClick={() => {
            startTransition(async () => {
              await createCorrection({
                roomId,
                originalMessage,
                correction,
                context: context || undefined,
              });
              router.refresh();
              setOriginalMessage("");
              setCorrection("");
              setContext("");
              setOpen(false);
            });
          }}
          className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Correction"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
