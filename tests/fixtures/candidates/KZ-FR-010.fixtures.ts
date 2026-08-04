import { KZ_FR_010 } from "../../../src/rules/candidates/KZ-FR-010";
import { defineCandidateFixtures } from "./candidate-fixture";

export const KZ_FR_010_FIXTURES = defineCandidateFixtures([
  {
    fixtureId: "KZ-FR-010-POS-SINGLE-UTERINE-SIBLING",
    relevantRuleId: "KZ-FR-010",
    heirInputs: [{ category: "uterine sibling", count: 1 }],
    requiredConditions: [
      "Exactly one uterine sibling is present; unresolved broader blockers are outside this narrow fixture.",
    ],
    expectedExactFraction: { numerator: "1", denominator: "6" },
    sourceReferences: KZ_FR_010.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-010-NEG-TWO-UTERINE-SIBLINGS",
    relevantRuleId: "KZ-FR-010",
    heirInputs: [{ category: "uterine sibling", count: 2 }],
    requiredConditions: [
      "Two uterine siblings are present, so the single-member one-sixth condition fails.",
    ],
    expectedExactFraction: { numerator: "0", denominator: "1" },
    sourceReferences: KZ_FR_010.sourceReferences,
    focus: "NEGATIVE",
  },
]);
