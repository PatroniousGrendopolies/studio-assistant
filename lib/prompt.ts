import type { RoomContent, SafetyRules } from "@/lib/content.ts";
import type { Correction } from "@/lib/db.ts";

// ---------------------------------------------------------------------------
// System prompt assembly
// ---------------------------------------------------------------------------

export function assembleSystemPrompt(
  room: RoomContent,
  safetyRules: SafetyRules,
  corrections?: Correction[],
): string {
  // Extract the first heading from overview.md as the room title
  const titleMatch = room.overview.match(/^#\s+(.+)$/m);
  const roomTitle = titleMatch ? titleMatch[1] : room.id;

  // Format equipment — iterate over all categories dynamically
  const equipmentLines: string[] = [];
  for (const [category, items] of Object.entries(room.equipment)) {
    if (!Array.isArray(items) || items.length === 0) continue;
    const heading = category.charAt(0).toUpperCase() + category.slice(1);
    equipmentLines.push(`### ${heading}`);
    for (const item of items) {
      const g = item as Record<string, unknown>;
      const details: string[] = [];
      if (g.type) details.push(String(g.type));
      if (g.location) details.push(`Location: ${g.location}`);
      if (g.channels) details.push(`Channels: ${g.channels}`);
      if (g.notes) details.push(String(g.notes));
      equipmentLines.push(`- **${g.name}**${details.length ? ` — ${details.join(". ")}` : ""}`);
    }
  }

  // Format patchbay — render as JSON-like readable text since structure varies
  const patchbayText = JSON.stringify(room.patchbay, null, 2);

  // Format SOPs
  const sopSections = room.sops.map((sop) => sop.content).join("\n\n---\n\n");

  // Format safety rules
  const safetyLines = safetyRules.rules.map(
    (rule) =>
      `⚠️ [${rule.severity.toUpperCase()}]: ${rule.trigger} — ${rule.warning}`,
  );

  // Format corrections if any exist
  let correctionsSection = "";
  if (corrections && corrections.length > 0) {
    const correctionLines = corrections.map((c, i) => {
      const date = new Date(c.created_at).toLocaleDateString();
      let entry = `${i + 1}. [${date}] WRONG: "${c.original_message}"\n   CORRECT: "${c.correction}"`;
      if (c.context) entry += `\n   CONTEXT: ${c.context}`;
      return entry;
    });

    correctionsSection = `\n\n## Past Corrections & Clarifications
The following are corrections from the studio owner based on past conversations.
Apply these corrections when relevant:

${correctionLines.join("\n\n")}`;
  }

  return `You are the Autoland studio assistant for ${roomTitle}.

Your goal is to help the user set up their session without needing the intervention of the studio owner if possible. Be thorough and meticulous when troubleshooting and help them to diagnose any problems they might encounter.

## Your Room
${room.overview}

## Equipment in This Room
${equipmentLines.join("\n")}

## Patchbay & Signal Routing
${patchbayText}

## Standard Operating Procedures
${sopSections}

## SAFETY RULES — HIGHEST PRIORITY
${safetyLines.join("\n")}
${correctionsSection}
## How You Behave
- Use plain, jargon-free language. Never assume the user knows technical terms.
- Always ask clarifying questions about the user's physical setup before giving instructions.
- If the user describes ANY action matching a safety rule, STOP the conversation and issue the safety warning BEFORE providing any other guidance. Format safety warnings prominently.
- Never assume you can see or monitor hardware. You only know what the user tells you.
- If you're unsure about something, recommend the user tap the "Get Staff Help" button.
- When walking through steps, go one at a time. Confirm the user completed each step before moving to the next.
- If the user seems confused or frustrated, offer the symptom picker: "Would it help if I showed you some common problems to pick from?"
- For access codes, alarm codes, or passwords, always direct users to check their personal onboarding document.`;
}
