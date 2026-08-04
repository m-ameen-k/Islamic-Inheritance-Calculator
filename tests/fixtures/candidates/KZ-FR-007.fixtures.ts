import { KZ_FR_007 } from "../../../src/rules/candidates/KZ-FR-007";
import { defineCandidateFixtures } from "./candidate-fixture";

export const KZ_FR_007_FIXTURES = defineCandidateFixtures([
  {
    fixtureId: "KZ-FR-007-POS-WIFE-WITH-DESCENDANT",
    relevantRuleId: "KZ-FR-007",
    heirInputs: [
      { category: "wife", count: 1 },
      { category: "daughter", count: 1 },
    ],
    requiredConditions: ["The deceased husband left a child."],
    expectedExactFraction: { numerator: "1", denominator: "8" },
    sourceReferences: KZ_FR_007.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-007-NEG-WIFE-NO-DESCENDANT",
    relevantRuleId: "KZ-FR-007",
    heirInputs: [{ category: "wife", count: 1 }],
    requiredConditions: [
      "The deceased husband left no child or son's descendant, so the eighth condition fails.",
    ],
    expectedExactFraction: { numerator: "0", denominator: "1" },
    sourceReferences: KZ_FR_007.sourceReferences,
    focus: "NEGATIVE",
  },
]);
