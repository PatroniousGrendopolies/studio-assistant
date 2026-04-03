import { describe, test, expect } from "bun:test";
import {
  loadRoom,
  loadSafetyRules,
  loadSymptoms,
  getAvailableRooms,
} from "../../lib/content";

describe("loadRoom", () => {
  test("returns a valid RoomContent with overview, sops, equipment, patchbay", () => {
    const room = loadRoom("room-a");
    expect(room.id).toBe("room-a");
    expect(typeof room.overview).toBe("string");
    expect(room.overview.length).toBeGreaterThan(0);
    expect(Array.isArray(room.sops)).toBe(true);
    expect(room.sops.length).toBeGreaterThan(0);
    expect(room.equipment).toBeDefined();
    expect(room.patchbay).toBeDefined();
  });

  test("throws for nonexistent room", () => {
    expect(() => loadRoom("nonexistent")).toThrow();
  });

  test("equipment has categories with valid gear items", () => {
    const room = loadRoom("room-a");
    const categories = Object.keys(room.equipment);
    expect(categories.length).toBeGreaterThan(0);
    for (const category of categories) {
      const items = room.equipment[category];
      expect(Array.isArray(items)).toBe(true);
      for (const item of items) {
        expect(typeof item.id).toBe("string");
        expect(typeof item.name).toBe("string");
      }
    }
  });

  test("has preamps with real studio gear", () => {
    const room = loadRoom("room-a");
    const preamps = room.equipment.preamps;
    expect(Array.isArray(preamps)).toBe(true);
    expect(preamps.length).toBeGreaterThanOrEqual(6);
  });
});

describe("loadSafetyRules", () => {
  test("returns rules with required fields", () => {
    const rules = loadSafetyRules();
    expect(rules.rules.length).toBeGreaterThan(0);
    for (const rule of rules.rules) {
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
    const symptoms = loadSymptoms();
    expect(symptoms.categories.length).toBeGreaterThan(0);
    for (const cat of symptoms.categories) {
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
    expect(rooms).toContain("room-a");
  });
});
