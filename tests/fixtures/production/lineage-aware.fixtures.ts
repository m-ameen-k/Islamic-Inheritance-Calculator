import { LINEAGE_RULE_IDS } from "../../../src/rules/lineage-hierarchy.ts";

export const LINEAGE_AWARE_PRODUCTION_FIXTURES = Object.values(LINEAGE_RULE_IDS).flatMap(
  (ruleId) => [
    { fixtureId: `${ruleId}-POS`, ruleId, focus: "POSITIVE" as const },
    { fixtureId: `${ruleId}-NEG`, ruleId, focus: "NEGATIVE" as const },
  ],
);
