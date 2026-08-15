import { defineKzFr011BlockingCandidate } from "../functional-mvp-candidate";

export const KZ_FR_011_FATHER_BLOCKS_PATERNAL_BROTHER = defineKzFr011BlockingCandidate({
  ruleId: "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER",
  blocker: "FATHER",
  blockee: "PATERNAL_BROTHER",
});
