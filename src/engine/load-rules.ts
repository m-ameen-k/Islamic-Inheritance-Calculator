import type { CalculationMode, Madhhab } from "../domain/inheritance-case";
import type { RuleRegistry } from "../domain/rule-registry";
import type { FiqhRuleRecord } from "../domain/rule-source";

export function loadEligibleRules(
  mode: CalculationMode,
  madhhab: Madhhab,
  registry: RuleRegistry,
): readonly FiqhRuleRecord[] {
  return registry.getEligibleRules(mode, madhhab);
}
