import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-028-AWL-ADJUSTMENT",
  parentResearchRuleId: "KZ-FR-028",
  atomicRuleKind: "AWL_ADJUSTMENT",
  conditions: [
    "The exact original asl is 6, 12, or 24.",
    "The admitted fixed-share saham exceed the original asl.",
    "The resulting endpoint is one of the eight source-corroborated pairs.",
  ],
  exclusions: [
    "This atom does not decide eligibility or fixed shares.",
    "Unlisted origins and endpoints are rejected.",
    "Floating-point and rounded-decimal arithmetic are excluded.",
  ],
  priority: { value: 160, rationale: "Apply after original-asl derivation and before tashih." },
  interactionsOrBlockers: [
    "Preserve every original integer saham and replace the denominator by their exact sum.",
    "No positive residue remains after awl.",
  ],
  outcomeSpecification:
    "Adjust every fixed share exactly by the source-enumerated awl denominator.",
  executionSpecification: {
    arithmetic: "BIGINT_ONLY",
    operation: "PRESERVE_SAHAM_REPLACE_DENOMINATOR_WITH_SAHAM_SUM",
    allowedEndpoints: {
      "6": ["7", "8", "9", "10"],
      "12": ["13", "15", "17"],
      "24": ["27"],
    },
  },
  fixtureIds: [
    "KZ-FR-028-AWL-ADJUSTMENT-SOURCE-6-TO-7",
    "KZ-FR-028-AWL-ADJUSTMENT-SOURCE-6-TO-8",
    "KZ-FR-028-AWL-ADJUSTMENT-SOURCE-6-TO-9",
    "KZ-FR-028-AWL-ADJUSTMENT-SOURCE-6-TO-10",
    "KZ-FR-028-AWL-ADJUSTMENT-SOURCE-12-TO-13",
    "KZ-FR-028-AWL-ADJUSTMENT-SOURCE-12-TO-15",
    "KZ-FR-028-AWL-ADJUSTMENT-SOURCE-12-TO-17",
    "KZ-FR-028-AWL-ADJUSTMENT-SOURCE-24-TO-27",
    "KZ-FR-028-AWL-ADJUSTMENT-NEG-NO-EXCESS",
    "KZ-FR-028-AWL-ADJUSTMENT-NEG-UNLISTED-ENDPOINT",
  ],
});
