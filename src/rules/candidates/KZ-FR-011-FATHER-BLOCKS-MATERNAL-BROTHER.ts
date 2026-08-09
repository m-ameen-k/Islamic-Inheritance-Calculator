import { defineKzFr011BlockingCandidate } from "../functional-mvp-candidate";

export const KZ_FR_011_FATHER_BLOCKS_MATERNAL_BROTHER = defineKzFr011BlockingCandidate({
  ruleId: "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER",
  blocker: "FATHER",
  blockee: "MATERNAL_BROTHER",
});
