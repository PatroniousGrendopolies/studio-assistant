import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const MicrophoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  phantomRequired: z.boolean(),
  weightLbs: z.number(),
  location: z.string(),
  notes: z.string(),
});

const StandSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxWeightLbs: z.number(),
  location: z.string(),
});

const PreampSchema = z.object({
  id: z.string(),
  name: z.string(),
  inputs: z.array(z.string()),
  hasPhantom: z.boolean(),
  patchbayPosition: z.string(),
});

const OtherGearSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  notes: z.string(),
});

export const EquipmentSchema = z.object({
  microphones: z.array(MicrophoneSchema),
  stands: z.array(StandSchema),
  preamps: z.array(PreampSchema),
  other: z.array(OtherGearSchema),
});

const PatchbayConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  cable: z.string(),
});

export const PatchbaySchema = z.object({
  layout: z.string(),
  connections: z.array(PatchbayConnectionSchema),
  tips: z.array(z.string()),
});

const SafetyRuleSchema = z.object({
  id: z.string(),
  trigger: z.string(),
  keywords: z.array(z.array(z.string())),
  warning: z.string(),
  severity: z.string(),
});

export const SafetyRulesSchema = z.object({
  rules: z.array(SafetyRuleSchema),
});

const SymptomCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  message: z.string(),
});

export const SymptomsSchema = z.object({
  categories: z.array(SymptomCategorySchema),
});

// ---------------------------------------------------------------------------
// Derived TypeScript types
// ---------------------------------------------------------------------------

export type Equipment = z.infer<typeof EquipmentSchema>;
export type Patchbay = z.infer<typeof PatchbaySchema>;
export type SafetyRules = z.infer<typeof SafetyRulesSchema>;
export type SafetyRule = z.infer<typeof SafetyRuleSchema>;
export type Symptoms = z.infer<typeof SymptomsSchema>;

export interface RoomContent {
  id: string;
  overview: string;
  sops: { filename: string; content: string }[];
  equipment: Equipment;
  patchbay: Patchbay;
}

// ---------------------------------------------------------------------------
// Content root helper
// ---------------------------------------------------------------------------

function contentDir(...segments: string[]): string {
  return path.join(process.cwd(), "content", ...segments);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function loadRoom(roomId: string): RoomContent {
  const roomDir = contentDir("rooms", roomId);

  // overview.md
  const overview = fs.readFileSync(path.join(roomDir, "overview.md"), "utf-8");

  // equipment.json
  const equipmentRaw = JSON.parse(
    fs.readFileSync(path.join(roomDir, "equipment.json"), "utf-8"),
  );
  const equipment = EquipmentSchema.parse(equipmentRaw);

  // patchbay.json
  const patchbayRaw = JSON.parse(
    fs.readFileSync(path.join(roomDir, "patchbay.json"), "utf-8"),
  );
  const patchbay = PatchbaySchema.parse(patchbayRaw);

  // sops/*.md — glob the directory for all markdown files
  const sopsDir = path.join(roomDir, "sops");
  const sops: RoomContent["sops"] = [];
  if (fs.existsSync(sopsDir)) {
    const files = fs
      .readdirSync(sopsDir)
      .filter((f) => f.endsWith(".md"))
      .sort();
    for (const filename of files) {
      const content = fs.readFileSync(path.join(sopsDir, filename), "utf-8");
      sops.push({ filename, content });
    }
  }

  return { id: roomId, overview, sops, equipment, patchbay };
}

export function loadSafetyRules(): SafetyRules {
  const raw = JSON.parse(
    fs.readFileSync(contentDir("safety", "rules.json"), "utf-8"),
  );
  return SafetyRulesSchema.parse(raw);
}

export function loadSymptoms(): Symptoms {
  const raw = JSON.parse(
    fs.readFileSync(contentDir("symptoms", "categories.json"), "utf-8"),
  );
  return SymptomsSchema.parse(raw);
}

export function getAvailableRooms(): string[] {
  const roomsDir = contentDir("rooms");
  return fs
    .readdirSync(roomsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}
