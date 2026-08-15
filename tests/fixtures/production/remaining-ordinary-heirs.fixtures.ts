import { REMAINING_ORDINARY_RULE_DEFINITIONS } from "../../../src/rules/remaining-ordinary-rules";

export const REMAINING_ORDINARY_RULE_IDS = REMAINING_ORDINARY_RULE_DEFINITIONS.map(
  ({ ruleId }) => ruleId,
);

export const REMAINING_ORDINARY_PRODUCTION_FIXTURES = REMAINING_ORDINARY_RULE_DEFINITIONS.flatMap(
  (rule) => [
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
      sourceCondition: rule.exclusions.join(" ") || "The positive condition is absent.",
      exactOutcome: "This atomic rule does not execute.",
    },
  ],
);
