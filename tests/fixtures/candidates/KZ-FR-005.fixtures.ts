import { KZ_FR_005 } from "../../../src/rules/candidates/KZ-FR-005";
import { defineCandidateFixtures } from "./candidate-fixture";

export const KZ_FR_005_FIXTURES = defineCandidateFixtures([
  {
    fixtureId: "KZ-FR-005-POS-HUSBAND-NO-DESCENDANT",
    relevantRuleId: "KZ-FR-005",
    heirInputs: [{ category: "husband", count: 1 }],
    requiredConditions: ["The deceased wife left no child or son's descendant."],
    expectedExactFraction: { numerator: "1", denominator: "2" },
    sourceReferences: KZ_FR_005.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-005-NEG-HUSBAND-WITH-DESCENDANT",
    relevantRuleId: "KZ-FR-005",
    heirInputs: [
      { category: "husband", count: 1 },
      { category: "daughter", count: 1 },
    ],
    requiredConditions: ["The deceased wife left a child, so the no-descendant condition fails."],
    expectedExactFraction: { numerator: "0", denominator: "1" },
    sourceReferences: KZ_FR_005.sourceReferences,
    focus: "NEGATIVE",
  },
]);
