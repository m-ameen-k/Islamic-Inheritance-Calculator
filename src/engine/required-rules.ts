import type { HeirType } from "../domain/heirs";
import type { InheritanceCase } from "../domain/inheritance-case";

export const SHAFII_REQUIRED_RULE_IDS = {
  ESTATE_OBLIGATIONS: "SHAFII_RULE_REQUIRED_ESTATE_OBLIGATIONS",
  WASIYYAH: "SHAFII_RULE_REQUIRED_WASIYYAH",
  FIXED_SHARES: "SHAFII_RULE_REQUIRED_FIXED_SHARES",
  BLOCKING: "SHAFII_RULE_REQUIRED_BLOCKING",
  RESIDUARY_DISTRIBUTION: "SHAFII_RULE_REQUIRED_RESIDUARY_DISTRIBUTION",
  AWL: "SHAFII_RULE_REQUIRED_AWL",
  RADD: "SHAFII_RULE_REQUIRED_RADD",
  GRANDFATHER_SIBLINGS: "SHAFII_RULE_REQUIRED_GRANDFATHER_SIBLINGS",
  SPECIAL_CASE: "SHAFII_RULE_REQUIRED_SPECIAL_CASE",
} as const;

export type RequiredRuleCategory = keyof typeof SHAFII_REQUIRED_RULE_IDS;
export type RequiredRuleId = (typeof SHAFII_REQUIRED_RULE_IDS)[RequiredRuleCategory];

export interface RuleRequirement {
  readonly category: RequiredRuleCategory;
  readonly ruleId: RequiredRuleId;
  readonly reason: string;
}

const SIBLING_TYPES = new Set<HeirType>([
  "FULL_BROTHER",
  "PATERNAL_BROTHER",
  "MATERNAL_BROTHER",
  "FULL_SISTER",
  "PATERNAL_SISTER",
  "MATERNAL_SISTER",
]);

function hasHeirType(input: InheritanceCase, type: HeirType): boolean {
  return input.heirs.some((heir) => heir.type === type);
}

/**
 * Identifies only requirements visible directly in the case facts. Awl, radd,
 * residuary, and special-case requirements need later verified-rule output and
 * are deliberately not inferred here.
 */
export function resolveRequiredRuleIds(input: InheritanceCase): readonly RuleRequirement[] {
  const requirements: RuleRequirement[] = [
    {
      category: "FIXED_SHARES",
      ruleId: SHAFII_REQUIRED_RULE_IDS.FIXED_SHARES,
      reason: "Share eligibility and exact shares require a verified source rule.",
    },
    {
      category: "BLOCKING",
      ruleId: SHAFII_REQUIRED_RULE_IDS.BLOCKING,
      reason: "Heir blocking must be resolved by a verified source rule.",
    },
  ];

  if (input.estate.obligations.length > 0) {
    requirements.push({
      category: "ESTATE_OBLIGATIONS",
      ruleId: SHAFII_REQUIRED_RULE_IDS.ESTATE_OBLIGATIONS,
      reason: "The case contains estate obligations requiring verified treatment.",
    });
  }

  if (input.estate.wasiyyah !== null) {
    requirements.push({
      category: "WASIYYAH",
      ruleId: SHAFII_REQUIRED_RULE_IDS.WASIYYAH,
      reason: "The case contains a wasiyyah requiring verified treatment.",
    });
  }

  if (
    hasHeirType(input, "PATERNAL_GRANDFATHER") &&
    input.heirs.some((heir) => SIBLING_TYPES.has(heir.type))
  ) {
    requirements.push({
      category: "GRANDFATHER_SIBLINGS",
      ruleId: SHAFII_REQUIRED_RULE_IDS.GRANDFATHER_SIBLINGS,
      reason: "The input contains a paternal grandfather and at least one sibling.",
    });
  }

  return requirements;
}
