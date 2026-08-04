import { KZ_FR_008 } from "../../../src/rules/candidates/KZ-FR-008";
import { defineCandidateFixtures } from "./candidate-fixture";

export const KZ_FR_008_FIXTURES = defineCandidateFixtures([
  {
    fixtureId: "KZ-FR-008-POS-TWO-DAUGHTERS",
    relevantRuleId: "KZ-FR-008",
    heirInputs: [{ category: "daughter", count: 2 }],
    requiredConditions: [
      "Two daughters are present without a brother; unresolved broader blockers are outside this narrow fixture.",
    ],
    expectedExactFraction: { numerator: "2", denominator: "3" },
    sourceReferences: KZ_FR_008.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-008-NEG-ONE-DAUGHTER",
    relevantRuleId: "KZ-FR-008",
    heirInputs: [{ category: "daughter", count: 1 }],
    requiredConditions: ["The category has only one member, so the plurality condition fails."],
    expectedExactFraction: { numerator: "0", denominator: "1" },
    sourceReferences: KZ_FR_008.sourceReferences,
    focus: "NEGATIVE",
  },
]);
