import { RuleRegistry } from "../../domain/rule-registry";
import { PROVISIONAL_SHAFII_RULES } from "./provisional-rules";
import { VERIFIED_SHAFII_RULES } from "./verified-rules";

export function createShafiiRuleRegistry(): RuleRegistry {
  return new RuleRegistry([...VERIFIED_SHAFII_RULES, ...PROVISIONAL_SHAFII_RULES]);
}
