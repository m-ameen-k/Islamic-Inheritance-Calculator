import { KZ_FR_009 } from "../../../src/rules/candidates/KZ-FR-009";
import { defineCandidateFixtures } from "./candidate-fixture";

export const KZ_FR_009_FIXTURES = defineCandidateFixtures([
  {
    fixtureId: "KZ-FR-009-POS-MOTHER-ORDINARY",
    relevantRuleId: "KZ-FR-009",
    heirInputs: [{ category: "mother", count: 1 }],
    requiredConditions: [
      "The deceased left no child or son's descendant.",
      "Fewer than two siblings are present.",
      "This is not an Umariyyatayn configuration.",
    ],
    expectedExactFraction: { numerator: "1", denominator: "3" },
    sourceReferences: KZ_FR_009.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-009-NEG-MOTHER-WITH-DESCENDANT",
    relevantRuleId: "KZ-FR-009",
    heirInputs: [
      { category: "mother", count: 1 },
      { category: "daughter", count: 1 },
    ],
    requiredConditions: ["A child is present, so the mother's ordinary one-third condition fails."],
    expectedExactFraction: { numerator: "0", denominator: "1" },
    sourceReferences: KZ_FR_009.sourceReferences,
    focus: "NEGATIVE",
  },
]);
