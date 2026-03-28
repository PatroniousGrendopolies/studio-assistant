import { describe, test, expect } from "bun:test";
import { loadSafetyRules } from "../../lib/content.ts";
import { checkSafetyRules } from "../../lib/safety.ts";

const { rules } = loadSafetyRules();

describe("checkSafetyRules", () => {
  test("returns the phantom-ribbon rule when mentioning phantom power with the Royer", () => {
    const match = checkSafetyRules(
      "I want to use phantom power with the Royer",
      rules,
    );

    expect(match).not.toBeNull();
    expect(match!.ruleId).toBe("phantom-ribbon");
    expect(match!.severity).toBe("critical");
  });

  test("returns null when no safety rule is triggered", () => {
    const match = checkSafetyRules("Let me set up the mic", rules);

    expect(match).toBeNull();
  });

  test("returns the heavy-mic-light-stand rule for u87 on desk stand", () => {
    const match = checkSafetyRules(
      "put the u87 on the desk stand",
      rules,
    );

    expect(match).not.toBeNull();
    expect(match!.ruleId).toBe("heavy-mic-light-stand");
    expect(match!.severity).toBe("high");
  });
});
