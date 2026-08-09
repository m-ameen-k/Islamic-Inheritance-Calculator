export const EXTENDED_ORDINARY_RULE_IDS = [
  "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS",
  "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF",
  "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS",
  "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH",
  "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH",
  "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD",
  "KZ-FR-005-ONE-FULL-SISTER-ONE-HALF",
  "KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS",
  "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF",
  "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS",
  "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH",
] as const;

const sourceFacts: Readonly<
  Record<(typeof EXTENDED_ORDINARY_RULE_IDS)[number], readonly [string, string]>
> = {
  "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS": [
    "Mother with two unblocked sisters receives 1/6.",
    "One sibling does not trigger the mother's 1/6.",
  ],
  "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF": [
    "One son's daughter without a direct child or son's son receives 1/2.",
    "A direct daughter excludes this isolated 1/2 atom.",
  ],
  "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS": [
    "Two son's daughters without a direct child or son's son receive 2/3 collectively.",
    "One son's daughter does not satisfy plurality.",
  ],
  "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH": [
    "One daughter takes 1/2 and one son's daughter takes the complementary 1/6.",
    "Two direct daughters exclude this narrow complement atom.",
  ],
  "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH": [
    "One uterine sibling without an ascendant or descendant blocker receives 1/6.",
    "Two uterine siblings require the collective 1/3 atom.",
  ],
  "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD": [
    "Two same-category uterine siblings receive 1/3 collectively.",
    "A descendant excludes the uterine-sibling share.",
  ],
  "KZ-FR-005-ONE-FULL-SISTER-ONE-HALF": [
    "One full sister without a male counterpart, ascendant, or descendant receives 1/2.",
    "Two full sisters require the collective atom.",
  ],
  "KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS": [
    "Two full sisters without a male counterpart, ascendant, or descendant receive 2/3 collectively.",
    "A full brother excludes the fixed-share atom.",
  ],
  "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF": [
    "One paternal sister without a nearer sibling, male counterpart, ascendant, or descendant receives 1/2.",
    "A full sibling excludes this isolated atom.",
  ],
  "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS": [
    "Two paternal sisters without a nearer sibling, male counterpart, ascendant, or descendant receive 2/3 collectively.",
    "One paternal sister does not satisfy plurality.",
  ],
  "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH": [
    "One full sister takes 1/2 and one paternal sister takes the complementary 1/6.",
    "Plural paternal sisters remain outside this narrow atom.",
  ],
};

export const EXTENDED_ORDINARY_PRODUCTION_FIXTURES = EXTENDED_ORDINARY_RULE_IDS.flatMap(
  (ruleId) => [
    {
      fixtureId: `${ruleId}-POS`,
      ruleId,
      focus: "POSITIVE" as const,
      fact: sourceFacts[ruleId][0],
    },
    {
      fixtureId: `${ruleId}-NEG`,
      ruleId,
      focus: "NEGATIVE" as const,
      fact: sourceFacts[ruleId][1],
    },
  ],
);
