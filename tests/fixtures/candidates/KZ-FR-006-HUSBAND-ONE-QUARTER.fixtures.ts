import { KZ_FR_006_HUSBAND_ONE_QUARTER } from "../../../src/rules/candidates/KZ-FR-006-HUSBAND-ONE-QUARTER";
import { defineAtomicSpouseFixtures } from "./spouse-share-fixture";

export const KZ_FR_006_HUSBAND_ONE_QUARTER_FIXTURES = defineAtomicSpouseFixtures([
  {
    fixtureId: "KZ-FR-006-HUSBAND-ONE-QUARTER-POS-WITH-QUALIFYING-DESCENDANT",
    relevantRuleId: "KZ-FR-006-HUSBAND-ONE-QUARTER",
    heirInputs: [{ category: "husband", count: 1 }],
    requiredConditions: ["A qualifying descendant is present."],
    qualifyingDescendantState: "PRESENT",
    expectedExactFraction: { numerator: "1", denominator: "4" },
    wifeGroupApportionment: null,
    sourceReferences: KZ_FR_006_HUSBAND_ONE_QUARTER.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-006-HUSBAND-ONE-QUARTER-NEG-NO-QUALIFYING-DESCENDANT",
    relevantRuleId: "KZ-FR-006-HUSBAND-ONE-QUARTER",
    heirInputs: [{ category: "husband", count: 1 }],
    requiredConditions: [
      "No qualifying descendant is present, so the one-quarter condition fails.",
    ],
    qualifyingDescendantState: "ABSENT",
    expectedExactFraction: { numerator: "0", denominator: "1" },
    wifeGroupApportionment: null,
    sourceReferences: KZ_FR_006_HUSBAND_ONE_QUARTER.sourceReferences,
    focus: "NEGATIVE",
  },
]);
