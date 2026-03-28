import type { SafetyRule } from "@/lib/content.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SafetyMatch {
  ruleId: string;
  trigger: string;
  warning: string;
  severity: string;
}

// ---------------------------------------------------------------------------
// Severity ordering (highest first)
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function severityRank(severity: string): number {
  return SEVERITY_ORDER[severity] ?? 99;
}

// ---------------------------------------------------------------------------
// Deterministic keyword pre-scan
// ---------------------------------------------------------------------------

/**
 * Checks a user message against safety rules using keyword matching.
 *
 * Rules are sorted by severity (critical > high > medium > low) before
 * scanning. For each rule, every keyword group is tested — a group matches
 * if ALL of its keywords appear in the lowercased message. The first rule
 * with any matching keyword group wins.
 */
export function checkSafetyRules(
  message: string,
  rules: SafetyRule[],
): SafetyMatch | null {
  const lowerMessage = message.toLowerCase();

  // Sort rules by severity, highest first
  const sorted = [...rules].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );

  for (const rule of sorted) {
    for (const keywordGroup of rule.keywords) {
      const allMatch = keywordGroup.every((keyword) =>
        lowerMessage.includes(keyword.toLowerCase()),
      );
      if (allMatch) {
        return {
          ruleId: rule.id,
          trigger: rule.trigger,
          warning: rule.warning,
          severity: rule.severity,
        };
      }
    }
  }

  return null;
}
