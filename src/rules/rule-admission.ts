export const ADMISSION_CHECK_NAMES = [
  "sourceComparisonComplete",
  "executableConditionsUnambiguous",
  "exclusionsComplete",
  "blockingInteractionsExplicit",
  "priorityExplicit",
  "exactSourceDerivedFixturesExist",
  "allAdmissionChecksPass",
] as const;

export type AdmissionCheckName = (typeof ADMISSION_CHECK_NAMES)[number];

export type AdmissionChecks = Readonly<Record<AdmissionCheckName, boolean>>;

/**
 * An append-only decision record authorizing one named rule to reach
 * CALCULATION_READY. The production manifest remains the separate final gate.
 */
export interface RuleAdmissionRecord {
  readonly admissionRecordId: string;
  readonly ruleId: string;
  readonly lifecycleStatus: "CALCULATION_READY";
  readonly sourceComparisonId: string;
  readonly reviewRecordIds: readonly string[];
  readonly fixtureIds: readonly string[];
  readonly checks: AdmissionChecks;
  readonly decision: "ADMITTED";
  readonly notes: string;
}

export function isRuleAdmissionRecord(value: unknown): value is RuleAdmissionRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const checks = record.checks;

  return (
    typeof record.admissionRecordId === "string" &&
    record.admissionRecordId.trim().length > 0 &&
    typeof record.ruleId === "string" &&
    record.ruleId.trim().length > 0 &&
    record.lifecycleStatus === "CALCULATION_READY" &&
    typeof record.sourceComparisonId === "string" &&
    record.sourceComparisonId.trim().length > 0 &&
    Array.isArray(record.reviewRecordIds) &&
    record.reviewRecordIds.length > 0 &&
    record.reviewRecordIds.every((id) => typeof id === "string" && id.trim().length > 0) &&
    Array.isArray(record.fixtureIds) &&
    record.fixtureIds.length > 0 &&
    record.fixtureIds.every((id) => typeof id === "string" && id.trim().length > 0) &&
    typeof checks === "object" &&
    checks !== null &&
    !Array.isArray(checks) &&
    ADMISSION_CHECK_NAMES.every((name) => (checks as Record<string, unknown>)[name] === true) &&
    record.decision === "ADMITTED" &&
    typeof record.notes === "string"
  );
}
