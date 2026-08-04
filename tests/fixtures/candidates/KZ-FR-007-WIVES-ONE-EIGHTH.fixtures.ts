import { KZ_FR_007_WIVES_ONE_EIGHTH } from "../../../src/rules/candidates/KZ-FR-007-WIVES-ONE-EIGHTH";
import { defineAtomicSpouseFixtures } from "./spouse-share-fixture";

export const KZ_FR_007_WIVES_ONE_EIGHTH_FIXTURES = defineAtomicSpouseFixtures([
  {
    fixtureId: "KZ-FR-007-WIVES-ONE-EIGHTH-POS-ONE-WIFE-WITH-QUALIFYING-DESCENDANT",
    relevantRuleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
    heirInputs: [{ category: "wife", count: 1 }],
    requiredConditions: ["A qualifying descendant is present."],
    descendantInputs: [{ heirId: "DESCENDANT-DAUGHTER", type: "DAUGHTER", count: 1 }],
    expectedExactFraction: { numerator: "1", denominator: "8" },
    wifeGroupApportionment: {
      collectiveExactFraction: { numerator: "1", denominator: "8" },
      numberOfWives: 1,
      expectedEqualPerWifeFraction: { numerator: "1", denominator: "8" },
    },
    sourceReferences: KZ_FR_007_WIVES_ONE_EIGHTH.sourceReferences,
    focus: "POSITIVE",
  },
  {
    fixtureId: "KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-TWO-WIVES-COLLECTIVE",
    relevantRuleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
    heirInputs: [{ category: "wife", count: 2 }],
    requiredConditions: [
      "A qualifying descendant is present.",
      "Two eligible wives divide the collective share equally.",
    ],
    descendantInputs: [{ heirId: "DESCENDANT-SONS-DAUGHTER", type: "SONS_DAUGHTER", count: 1 }],
    expectedExactFraction: { numerator: "1", denominator: "8" },
    wifeGroupApportionment: {
      collectiveExactFraction: { numerator: "1", denominator: "8" },
      numberOfWives: 2,
      expectedEqualPerWifeFraction: { numerator: "1", denominator: "16" },
    },
    sourceReferences: KZ_FR_007_WIVES_ONE_EIGHTH.sourceReferences,
    focus: "BOUNDARY_FOCUSED",
  },
  {
    fixtureId: "KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-FOUR-WIVES-COLLECTIVE",
    relevantRuleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
    heirInputs: [{ category: "wife", count: 4 }],
    requiredConditions: [
      "A qualifying descendant is present.",
      "Four eligible wives divide the collective share equally.",
    ],
    descendantInputs: [{ heirId: "DESCENDANT-SON", type: "SON", count: 1 }],
    expectedExactFraction: { numerator: "1", denominator: "8" },
    wifeGroupApportionment: {
      collectiveExactFraction: { numerator: "1", denominator: "8" },
      numberOfWives: 4,
      expectedEqualPerWifeFraction: { numerator: "1", denominator: "32" },
    },
    sourceReferences: KZ_FR_007_WIVES_ONE_EIGHTH.sourceReferences,
    focus: "BOUNDARY_FOCUSED",
  },
  {
    fixtureId: "KZ-FR-007-WIVES-ONE-EIGHTH-NEG-NO-QUALIFYING-DESCENDANT",
    relevantRuleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
    heirInputs: [{ category: "wife", count: 1 }],
    requiredConditions: ["No qualifying descendant is present, so the one-eighth condition fails."],
    descendantInputs: [],
    expectedExactFraction: { numerator: "0", denominator: "1" },
    wifeGroupApportionment: {
      collectiveExactFraction: { numerator: "0", denominator: "1" },
      numberOfWives: 1,
      expectedEqualPerWifeFraction: { numerator: "0", denominator: "1" },
    },
    sourceReferences: KZ_FR_007_WIVES_ONE_EIGHTH.sourceReferences,
    focus: "NEGATIVE",
  },
]);
