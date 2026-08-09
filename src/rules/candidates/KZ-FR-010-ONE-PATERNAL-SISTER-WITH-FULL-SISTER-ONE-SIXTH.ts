import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_010_ONE_PATERNAL_SISTER_WITH_FULL_SISTER_ONE_SIXTH =
  defineFunctionalMvpCandidate({
    ruleId: "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH",
    parentResearchRuleId: "KZ-FR-010",
    sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
    atomicRuleKind: "EXTENDED_FIXED_SHARE",
    conditions: [
      "Exactly one full sister and one paternal sister are present without an ascendant, descendant, or brother of either class.",
    ],
    exclusions: ["Plural paternal sisters and every residuary-conversion case are excluded."],
    priority: { value: 65, rationale: "The complement applies after the full sister's 1/2." },
    interactionsOrBlockers: [
      "The paternal-sister share completes the sisters' fixed shares to 2/3.",
    ],
    outcomeSpecification: "The paternal sister receives the complementary 1/6.",
    executionSpecification: {
      heirCategory: "PATERNAL_SISTER",
      fixedShare: { numerator: "1", denominator: "6" },
    },
  });
