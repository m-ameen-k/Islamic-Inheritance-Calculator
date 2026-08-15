import { ADVANCED_RULE_DEFINITIONS } from "../../../src/rules/advanced-shafii-rules";

export const ADVANCED_RULE_IDS = ADVANCED_RULE_DEFINITIONS.map(({ ruleId }) => ruleId);

export const ADVANCED_PRODUCTION_FIXTURES = ADVANCED_RULE_DEFINITIONS.flatMap((rule) => [
  {
    fixtureId: `${rule.ruleId}-POS`,
    ruleId: rule.ruleId,
    focus: "POSITIVE" as const,
    sourceCondition: rule.conditions.join(" "),
    exactOutcome: rule.outcomeSpecification,
  },
  {
    fixtureId: `${rule.ruleId}-NEG`,
    ruleId: rule.ruleId,
    focus: "NEGATIVE" as const,
    sourceCondition: rule.exclusions.join(" "),
    exactOutcome: "This atomic rule does not execute.",
  },
]);
