import { KZ_FR_006_WIVES_ONE_QUARTER } from "../../../src/rules/candidates/KZ-FR-006-WIVES-ONE-QUARTER";
import { defineAtomicSpouseFixtures } from "./spouse-share-fixture";

export const KZ_FR_006_WIVES_ONE_QUARTER_FIXTURES = defineAtomicSpouseFixtures([
  {
    fixtureId: "KZ-FR-006-WIVES-ONE-QUARTER-POS-ONE-WIFE-NO-QUALIFYING-DESCENDANT",
    relevantRuleId: "KZ-FR-006-WIVES-ONE-QUARTER",
    heirInputs: [{ category: "wife", count: 1 }],
    requiredConditions: ["No qualifying descendant is present."],
    qualifyingDescendantState: "ABSENT",
    expectedExactFraction: { numerator: "1", denominator: "4" },
    wifeGroupApportionment: {
      collectiveExactFraction: { numerator: "1", denominator: "4" },
      numberOfWives: 1,
      expectedEqualPerWifeFraction: { numerator: "1", denominator: "4" },
    },
    sourceReferences: KZ_FR_006_WIVES_ONE_QUARTER.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-006-WIVES-ONE-QUARTER-BOUNDARY-TWO-WIVES-COLLECTIVE",
    relevantRuleId: "KZ-FR-006-WIVES-ONE-QUARTER",
    heirInputs: [{ category: "wife", count: 2 }],
    requiredConditions: [
      "No qualifying descendant is present.",
      "Two eligible wives divide the collective share equally.",
    ],
    qualifyingDescendantState: "ABSENT",
    expectedExactFraction: { numerator: "1", denominator: "4" },
    wifeGroupApportionment: {
      collectiveExactFraction: { numerator: "1", denominator: "4" },
      numberOfWives: 2,
      expectedEqualPerWifeFraction: { numerator: "1", denominator: "8" },
    },
    sourceReferences: KZ_FR_006_WIVES_ONE_QUARTER.sourceReferences,
    focus: "BOUNDARY_FOCUSED",
  },
  {
    fixtureId: "KZ-FR-006-WIVES-ONE-QUARTER-NEG-WITH-QUALIFYING-DESCENDANT",
    relevantRuleId: "KZ-FR-006-WIVES-ONE-QUARTER",
    heirInputs: [{ category: "wife", count: 1 }],
    requiredConditions: ["A qualifying descendant is present, so the one-quarter condition fails."],
    qualifyingDescendantState: "PRESENT",
    expectedExactFraction: { numerator: "0", denominator: "1" },
    wifeGroupApportionment: {
      collectiveExactFraction: { numerator: "0", denominator: "1" },
      numberOfWives: 1,
      expectedEqualPerWifeFraction: { numerator: "0", denominator: "1" },
    },
    sourceReferences: KZ_FR_006_WIVES_ONE_QUARTER.sourceReferences,
    focus: "NEGATIVE",
  },
]);
