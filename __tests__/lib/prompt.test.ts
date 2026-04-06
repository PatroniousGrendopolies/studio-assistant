import { describe, test, expect } from "bun:test";
import { loadRoom, loadSafetyRules } from "../../lib/content.ts";
import { assembleSystemPrompt } from "../../lib/prompt.ts";
import type { Correction } from "../../lib/db.ts";

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

  test("includes safety rules with severity labels", () => {
    const prompt = assembleSystemPrompt(room, safetyRules);

    for (const rule of safetyRules.rules) {
      expect(prompt).toContain(`[${rule.severity.toUpperCase()}]`);
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

  // -------------------------------------------------------------------------
  // Corrections parameter
  // -------------------------------------------------------------------------

  test("with no corrections argument, prompt does not contain Past Corrections", () => {
    const prompt = assembleSystemPrompt(room, safetyRules);
    expect(prompt).not.toContain("Past Corrections");
  });

  test("with empty corrections array, prompt does not contain Past Corrections", () => {
    const prompt = assembleSystemPrompt(room, safetyRules, []);
    expect(prompt).not.toContain("Past Corrections");
  });

  test("with corrections, prompt contains corrections section and text", () => {
    const mockCorrections: Correction[] = [
      {
        id: "corr-1",
        room_id: "room-a",
        flag_id: null,
        original_message: "Connect the SM7B to slot 3",
        correction:
          "The SM7B routes through the API 512c preamp first (slot 7)",
        context: "Patchbay routing for vocal chain",
        active: true,
        created_at: "2026-03-15T10:00:00Z",
      },
    ];

    const prompt = assembleSystemPrompt(room, safetyRules, mockCorrections);

    // Contains the section heading
    expect(prompt).toContain("Past Corrections & Clarifications");

    // Contains the correction text
    expect(prompt).toContain(
      "The SM7B routes through the API 512c preamp first (slot 7)",
    );
  });

  test("corrections section appears BEFORE 'How You Behave'", () => {
    const mockCorrections: Correction[] = [
      {
        id: "corr-1",
        room_id: "room-a",
        flag_id: null,
        original_message: "Connect the SM7B to slot 3",
        correction:
          "The SM7B routes through the API 512c preamp first (slot 7)",
        context: "Patchbay routing for vocal chain",
        active: true,
        created_at: "2026-03-15T10:00:00Z",
      },
    ];

    const prompt = assembleSystemPrompt(room, safetyRules, mockCorrections);

    const correctionsIdx = prompt.indexOf(
      "Past Corrections & Clarifications",
    );
    const behaviorIdx = prompt.indexOf("## How You Behave");

    expect(correctionsIdx).toBeGreaterThan(-1);
    expect(behaviorIdx).toBeGreaterThan(-1);
    expect(correctionsIdx).toBeLessThan(behaviorIdx);
  });
});
