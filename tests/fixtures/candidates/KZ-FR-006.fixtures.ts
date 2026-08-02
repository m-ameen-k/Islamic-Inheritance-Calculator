import { KZ_FR_006 } from "../../../src/rules/candidates/KZ-FR-006";
import { defineCandidateFixtures } from "./candidate-fixture";

export const KZ_FR_006_FIXTURES = defineCandidateFixtures([
  {
    fixtureId: "KZ-FR-006-POS-HUSBAND-WITH-DESCENDANT",
    relevantRuleId: "KZ-FR-006",
    heirInputs: [
      { category: "husband", count: 1 },
      { category: "daughter", count: 1 },
    ],
    requiredConditions: ["The deceased wife left a child."],
    expectedExactFraction: { numerator: "1", denominator: "4" },
    sourceReferences: KZ_FR_006.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-006-NEG-HUSBAND-NO-DESCENDANT",
    relevantRuleId: "KZ-FR-006",
    heirInputs: [{ category: "husband", count: 1 }],
    requiredConditions: [
      "The deceased wife left no child or son's descendant, so the husband's quarter condition fails.",
    ],
    expectedExactFraction: { numerator: "0", denominator: "1" },
    sourceReferences: KZ_FR_006.sourceReferences,
    focus: "NEGATIVE",
  },
]);
