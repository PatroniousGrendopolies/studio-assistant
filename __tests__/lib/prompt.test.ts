import { describe, test, expect } from "bun:test";
import { loadRoom, loadSafetyRules } from "../../lib/content.ts";
import { assembleSystemPrompt } from "../../lib/prompt.ts";

const room = loadRoom("room-a");
const safetyRules = loadSafetyRules();

describe("assembleSystemPrompt", () => {
  test("includes the room name from the overview heading", () => {
    const prompt = assembleSystemPrompt(room, safetyRules);

    // The prompt should reference the room title extracted from overview.md
    const titleMatch = room.overview.match(/^#\s+(.+)$/m);
    const expectedTitle = titleMatch ? titleMatch[1] : room.id;

    expect(prompt).toContain(expectedTitle);
  });

  test("includes safety rules with warning icons", () => {
    const prompt = assembleSystemPrompt(room, safetyRules);

    // Each safety rule should appear with the warning emoji prefix
    for (const rule of safetyRules.rules) {
      expect(prompt).toContain(`\u26a0\ufe0f [${rule.severity.toUpperCase()}]`);
      expect(prompt).toContain(rule.warning);
    }
  });

  test("includes SOP content from markdown files", () => {
    const prompt = assembleSystemPrompt(room, safetyRules);

    // Each SOP's content should be present in the assembled prompt
    for (const sop of room.sops) {
      expect(prompt).toContain(sop.content);
    }
  });
});
