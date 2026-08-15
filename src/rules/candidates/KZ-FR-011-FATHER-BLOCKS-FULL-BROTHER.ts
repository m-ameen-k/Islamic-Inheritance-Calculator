import { defineKzFr011BlockingCandidate } from "../functional-mvp-candidate";

export const KZ_FR_011_FATHER_BLOCKS_FULL_BROTHER = defineKzFr011BlockingCandidate({
  ruleId: "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER",
  blocker: "FATHER",
  blockee: "FULL_BROTHER",
});
