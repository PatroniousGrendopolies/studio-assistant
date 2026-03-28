import { describe, test, expect } from "bun:test";
import {
  loadRoom,
  loadSafetyRules,
  loadSymptoms,
  getAvailableRooms,
} from "../../lib/content.ts";

describe("loadRoom", () => {
  test("returns a valid RoomContent with overview, sops, equipment, patchbay", () => {
    const room = loadRoom("room-a");

    expect(room.id).toBe("room-a");
    expect(typeof room.overview).toBe("string");
    expect(room.overview.length).toBeGreaterThan(0);
    expect(Array.isArray(room.sops)).toBe(true);
    expect(room.equipment).toBeDefined();
    expect(room.patchbay).toBeDefined();
    expect(typeof room.patchbay.layout).toBe("string");
    expect(Array.isArray(room.patchbay.connections)).toBe(true);
    expect(Array.isArray(room.patchbay.tips)).toBe(true);
  });

  test("throws an error for a nonexistent room", () => {
    expect(() => loadRoom("nonexistent")).toThrow();
  });

  test("equipment has a microphones array with valid entries", () => {
    const room = loadRoom("room-a");
    const { microphones } = room.equipment;

    expect(Array.isArray(microphones)).toBe(true);
    expect(microphones.length).toBeGreaterThan(0);

    for (const mic of microphones) {
      expect(typeof mic.id).toBe("string");
      expect(typeof mic.name).toBe("string");
      expect(typeof mic.type).toBe("string");
      expect(typeof mic.phantomRequired).toBe("boolean");
      expect(typeof mic.weightLbs).toBe("number");
      expect(typeof mic.location).toBe("string");
      expect(typeof mic.notes).toBe("string");
    }
  });
});

describe("loadSafetyRules", () => {
  test("returns an array of rules with required fields", () => {
    const { rules } = loadSafetyRules();

    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);

    for (const rule of rules) {
      expect(typeof rule.id).toBe("string");
      expect(typeof rule.trigger).toBe("string");
      expect(Array.isArray(rule.keywords)).toBe(true);
      expect(typeof rule.warning).toBe("string");
      expect(typeof rule.severity).toBe("string");
    }
  });
});

describe("loadSymptoms", () => {
  test("returns categories with required fields", () => {
    const { categories } = loadSymptoms();

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);

    for (const cat of categories) {
      expect(typeof cat.id).toBe("string");
      expect(typeof cat.label).toBe("string");
      expect(typeof cat.icon).toBe("string");
      expect(typeof cat.message).toBe("string");
    }
  });
});

describe("getAvailableRooms", () => {
  test("returns at least room-a", () => {
    const rooms = getAvailableRooms();

    expect(Array.isArray(rooms)).toBe(true);
    expect(rooms).toContain("room-a");
  });
});
