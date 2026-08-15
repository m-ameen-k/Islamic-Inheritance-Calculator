import { extendedResiduaryCandidates } from "../../../src/rules/extended-residuary-rules";

export const EXTENDED_RESIDUARY_PRODUCTION_FIXTURES = extendedResiduaryCandidates.flatMap(
  (rule) => [
    {
      fixtureId: rule.fixtureIds[0] as string,
      ruleId: rule.ruleId,
      focus: "POSITIVE" as const,
      sourceCondition: rule.conditions.join(" "),
      exactOutcome: rule.outcomeSpecification,
    },
    {
      fixtureId: rule.fixtureIds[1] as string,
      ruleId: rule.ruleId,
      focus: "NEGATIVE" as const,
      sourceCondition: rule.exclusions.join(" "),
      exactOutcome: "This atomic rule does not execute.",
    },
  ],
);
