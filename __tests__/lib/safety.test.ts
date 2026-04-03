import { describe, test, expect } from "bun:test";
import { loadSafetyRules } from "../../lib/content.ts";
import { checkSafetyRules } from "../../lib/safety.ts";

const { rules } = loadSafetyRules();

describe("checkSafetyRules", () => {
  test("returns the phantom-ribbon rule when mentioning phantom power with the Royer", () => {
    const match = checkSafetyRules(
      "I want to turn on phantom power with the Royer ribbon mic",
      rules,
    );

    expect(match).not.toBeNull();
    expect(match!.ruleId).toBe("mic02");
    expect(match!.severity).toBe("critical");
  });

  test("returns null when no safety rule is triggered", () => {
    const match = checkSafetyRules("Let me set up the mic", rules);

    expect(match).toBeNull();
  });

  test("returns a rule for heavy mic on small stand", () => {
    const match = checkSafetyRules(
      "I'm going to put the tube mic on the small stand",
      rules,
    );

    expect(match).not.toBeNull();
    expect(match!.ruleId).toBe("mic01");
    expect(match!.severity).toBe("critical");
  });

  test("catches drinks near console", () => {
    const match = checkSafetyRules(
      "I'm going to put my coffee near the console",
      rules,
    );

    expect(match).not.toBeNull();
    expect(match!.ruleId).toBe("env04");
  });
});
