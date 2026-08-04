import { KZ_FR_005_HUSBAND_ONE_HALF } from "../../../src/rules/candidates/KZ-FR-005-HUSBAND-ONE-HALF";
import { defineAtomicSpouseFixtures } from "./spouse-share-fixture";

export const KZ_FR_005_HUSBAND_ONE_HALF_FIXTURES = defineAtomicSpouseFixtures([
  {
    fixtureId: "KZ-FR-005-HUSBAND-ONE-HALF-POS-NO-QUALIFYING-DESCENDANT",
    relevantRuleId: "KZ-FR-005-HUSBAND-ONE-HALF",
    heirInputs: [{ category: "husband", count: 1 }],
    requiredConditions: ["No qualifying descendant is present."],
    descendantInputs: [],
    expectedExactFraction: { numerator: "1", denominator: "2" },
    wifeGroupApportionment: null,
    sourceReferences: KZ_FR_005_HUSBAND_ONE_HALF.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-005-HUSBAND-ONE-HALF-BOUNDARY-NON-DESCENDANT-HEIR",
    relevantRuleId: "KZ-FR-005-HUSBAND-ONE-HALF",
    heirInputs: [
      { category: "husband", count: 1 },
      { category: "full brother", count: 1 },
    ],
    requiredConditions: ["A non-descendant heir does not alter the spouse descendant condition."],
    descendantInputs: [{ heirId: "NON-DESCENDANT", type: "FULL_BROTHER", count: 1 }],
    expectedExactFraction: { numerator: "1", denominator: "2" },
    wifeGroupApportionment: null,
    sourceReferences: KZ_FR_005_HUSBAND_ONE_HALF.sourceReferences,
    focus: "BOUNDARY_FOCUSED",
  },
  {
    fixtureId: "KZ-FR-005-HUSBAND-ONE-HALF-NEG-WITH-QUALIFYING-DESCENDANT",
    relevantRuleId: "KZ-FR-005-HUSBAND-ONE-HALF",
    heirInputs: [{ category: "husband", count: 1 }],
    requiredConditions: ["A qualifying descendant is present, so the one-half condition fails."],
    descendantInputs: [{ heirId: "DESCENDANT-DAUGHTER", type: "DAUGHTER", count: 1 }],
    expectedExactFraction: { numerator: "0", denominator: "1" },
    wifeGroupApportionment: null,
    sourceReferences: KZ_FR_005_HUSBAND_ONE_HALF.sourceReferences,
    focus: "NEGATIVE",
  },
]);
