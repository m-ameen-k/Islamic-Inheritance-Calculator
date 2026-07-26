import type { FiqhRuleRecord } from "../../domain/rule-source";

/**
 * Production provisional rule data is intentionally empty. Internet summaries
 * must not be inserted here as substitutes for the user's supplied kitabs.
 */
export const PROVISIONAL_SHAFII_RULES: readonly FiqhRuleRecord[] = Object.freeze([]);
