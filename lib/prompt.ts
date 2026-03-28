import type { RoomContent, SafetyRules } from "@/lib/content.ts";

// ---------------------------------------------------------------------------
// System prompt assembly
// ---------------------------------------------------------------------------

export function assembleSystemPrompt(
  room: RoomContent,
  safetyRules: SafetyRules,
): string {
  // Extract the first heading from overview.md as the room title
  const titleMatch = room.overview.match(/^#\s+(.+)$/m);
  const roomTitle = titleMatch ? titleMatch[1] : room.id;

  // Format equipment
  const equipmentLines: string[] = [];

  if (room.equipment.microphones.length > 0) {
    equipmentLines.push("### Microphones");
    for (const mic of room.equipment.microphones) {
      equipmentLines.push(
        `- **${mic.name}** (${mic.type}) — Location: ${mic.location}. Weight: ${mic.weightLbs} lbs. ${mic.notes}`,
      );
    }
  }

  if (room.equipment.stands.length > 0) {
    equipmentLines.push("### Stands");
    for (const stand of room.equipment.stands) {
      equipmentLines.push(
        `- **${stand.name}** — Location: ${stand.location}. Max weight: ${stand.maxWeightLbs} lbs.`,
      );
    }
  }

  if (room.equipment.preamps.length > 0) {
    equipmentLines.push("### Preamps");
    for (const preamp of room.equipment.preamps) {
      equipmentLines.push(
        `- **${preamp.name}** — Inputs: ${preamp.inputs.join(", ")}. Phantom: ${preamp.hasPhantom ? "Yes" : "No"}. Patchbay position: ${preamp.patchbayPosition}.`,
      );
    }
  }

  if (room.equipment.other.length > 0) {
    equipmentLines.push("### Other");
    for (const item of room.equipment.other) {
      equipmentLines.push(
        `- **${item.name}** — Location: ${item.location}. ${item.notes}`,
      );
    }
  }

  // Format patchbay connections
  const connectionLines = room.patchbay.connections.map(
    (c) => `- ${c.from} → ${c.to} (${c.cable})`,
  );

  // Format patchbay tips
  const tipLines = room.patchbay.tips.map((t) => `- ${t}`);

  // Format SOPs
  const sopSections = room.sops.map((sop) => sop.content).join("\n\n---\n\n");

  // Format safety rules
  const safetyLines = safetyRules.rules.map(
    (rule) =>
      `⚠️ [${rule.severity.toUpperCase()}]: ${rule.trigger} — ${rule.warning}`,
  );

  return `You are the Autoland studio assistant for ${roomTitle}.

Your goal is to help the user set up their session without needing the intervention of the studio owner if possible. Be thorough and meticulous when troubleshooting and help them to diagnose any problems they might encounter.

## Your Room
${room.overview}

## Equipment in This Room
${equipmentLines.join("\n")}

## Patchbay
${room.patchbay.layout}

### Default Connections
${connectionLines.join("\n")}

### Tips
${tipLines.join("\n")}

## Standard Operating Procedures
${sopSections}

## SAFETY RULES — HIGHEST PRIORITY
${safetyLines.join("\n")}

## How You Behave
- Use plain, jargon-free language. Never assume the user knows technical terms.
- Always ask clarifying questions about the user's physical setup before giving instructions.
- If the user describes ANY action matching a safety rule, STOP the conversation and issue the safety warning BEFORE providing any other guidance. Format safety warnings prominently.
- Never assume you can see or monitor hardware. You only know what the user tells you.
- If you're unsure about something, recommend the user tap the "Get Staff Help" button.
- When walking through steps, go one at a time. Confirm the user completed each step before moving to the next.
- If the user seems confused or frustrated, offer the symptom picker: "Would it help if I showed you some common problems to pick from?"`;
}
