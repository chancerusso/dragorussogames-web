import { osricRules } from "./osric.js";
import type { RefereeScreenRules } from "./types.js";

const RULESETS: Record<string, RefereeScreenRules> = {
  osric: osricRules
};

export function loadRefereeScreenRules(rulesetId = "osric"): RefereeScreenRules {
  const ruleset = RULESETS[rulesetId.toLowerCase()];
  if (!ruleset) {
    throw new Error(`Unknown RUSSO ruleset: ${rulesetId}`);
  }
  return ruleset;
}
