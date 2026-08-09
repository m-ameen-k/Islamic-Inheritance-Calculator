import { leastCommonMultiple, type Fraction } from "../domain/fractions";
import type { ProductionRuleFile } from "../rules/rule-file";

export const ORIGINAL_ASL_RULE_ID = "KZ-FR-027-ORIGINAL-ASL" as const;
export const AWL_RULE_ID = "KZ-FR-028-AWL-ADJUSTMENT" as const;

function productionRule(
  rules: readonly ProductionRuleFile[],
  ruleId: string,
): ProductionRuleFile | undefined {
  return rules.find(
    (rule) => rule.ruleId === ruleId && rule.lifecycleStatus === "PRODUCTION" && rule.executable,
  );
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

function executionSpecification(rule: ProductionRuleFile): Readonly<Record<string, unknown>> {
  const value = (rule as unknown as { readonly executionSpecification?: unknown })
    .executionSpecification;
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : {};
}

export function deriveOriginalAsl(fixedShares: readonly Fraction[]): bigint {
  return fixedShares.reduce((origin, share) => leastCommonMultiple(origin, share.denominator), 1n);
}

export function isOriginalAslAdmitted(
  originalAsl: bigint,
  rules: readonly ProductionRuleFile[],
): boolean {
  const rule = productionRule(rules, ORIGINAL_ASL_RULE_ID);
  if (rule === undefined) return false;
  const specification = executionSpecification(rule);
  if (originalAsl === 1n) return specification.noFixedShareIdentity === "1";
  return stringArray(specification.allowedFixedShareOrigins).includes(originalAsl.toString());
}

export function originalSaham(share: Fraction, originalAsl: bigint): bigint {
  if (originalAsl % share.denominator !== 0n) {
    throw new RangeError("A fixed-share denominator does not divide the original asl.");
  }
  return share.numerator * (originalAsl / share.denominator);
}

export function deriveAwlDenominator(
  fixedShares: readonly Fraction[],
  originalAsl: bigint,
): bigint | null {
  const sum = fixedShares.reduce((total, share) => total + originalSaham(share, originalAsl), 0n);
  return sum > originalAsl ? sum : null;
}

export function isAwlEndpointAdmitted(
  originalAsl: bigint,
  awlDenominator: bigint,
  rules: readonly ProductionRuleFile[],
): boolean {
  const rule = productionRule(rules, AWL_RULE_ID);
  if (rule === undefined) return false;
  const endpoints = executionSpecification(rule).allowedEndpoints;
  if (endpoints === null || typeof endpoints !== "object" || Array.isArray(endpoints)) return false;
  return stringArray(
    (endpoints as Readonly<Record<string, unknown>>)[originalAsl.toString()],
  ).includes(awlDenominator.toString());
}
