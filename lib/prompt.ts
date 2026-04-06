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

  // Format equipment — compact format, no IDs, merge details into one line
  const equipmentLines: string[] = [];
  for (const [category, items] of Object.entries(room.equipment)) {
    if (!Array.isArray(items) || items.length === 0) continue;
    const heading = category.charAt(0).toUpperCase() + category.slice(1);
    equipmentLines.push(`### ${heading}`);
    for (const item of items) {
      const g = item as Record<string, unknown>;
      const parts: string[] = [];
      if (g.type) parts.push(String(g.type));
      if (g.phantomRequired) parts.push("needs phantom");
      if (g.phantomWarning) parts.push(String(g.phantomWarning));
      if (g.location) parts.push(String(g.location));
      if (g.notes) parts.push(String(g.notes));
      equipmentLines.push(`- ${g.name}${parts.length ? `: ${parts.join(". ")}` : ""}`);
    }
  }

  // Format patchbay — condensed text instead of raw JSON
  const patchbayText = formatPatchbay(room.patchbay);

  // Format SOPs
  const sopSections = room.sops.map((sop) => sop.content).join("\n\n---\n\n");

  // Format safety rules — warnings only, no keyword arrays (pre-scan handles matching)
  const safetyLines = safetyRules.rules.map(
    (rule) =>
      `- [${rule.severity.toUpperCase()}] ${rule.trigger}: ${rule.warning}`,
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

// ---------------------------------------------------------------------------
// Patchbay formatter — condensed text from JSON structure
// ---------------------------------------------------------------------------

function formatPatchbay(patchbay: Record<string, unknown>): string {
  const bays = patchbay.bays as Array<Record<string, unknown>> | undefined;
  if (!bays || !Array.isArray(bays)) return JSON.stringify(patchbay);

  const lines: string[] = [];

  for (const bay of bays) {
    lines.push(`### ${bay.name}`);
    if (bay.description) lines.push(String(bay.description));

    const topRow = bay.topRow as Record<string, unknown> | undefined;
    if (topRow?.sections) {
      const label = topRow.label ? `${topRow.label}` : "Top row";
      lines.push(`**${label}:**`);
      for (const s of topRow.sections as Array<Record<string, unknown>>) {
        const ch = s.channels || s.channel || "";
        const det = s.detail || "";
        lines.push(`- ${s.label}${ch ? ` (${ch})` : ""}${det ? `: ${det}` : ""}`);
      }
    }

    const bottomRow = bay.bottomRow as Record<string, unknown> | undefined;
    if (bottomRow?.sections) {
      const label = bottomRow.label ? `${bottomRow.label}` : "Bottom row";
      lines.push(`**${label}:**`);
      for (const s of bottomRow.sections as Array<Record<string, unknown>>) {
        const ch = s.channels || s.channel || "";
        const det = s.detail || "";
        lines.push(`- ${s.label}${ch ? ` (${ch})` : ""}${det ? `: ${det}` : ""}`);
      }
    }

    if (bay.normaling) lines.push(`**Normaling:** ${bay.normaling}`);
    lines.push("");
  }

  // Add tips
  const tips = patchbay.tips as string[] | undefined;
  if (tips && Array.isArray(tips)) {
    lines.push("### Tips");
    for (const tip of tips) {
      lines.push(`- ${tip}`);
    }
  }

  return lines.join("\n");
}
