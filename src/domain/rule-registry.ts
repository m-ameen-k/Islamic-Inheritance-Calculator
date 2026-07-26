import type { CalculationMode, Madhhab } from "./inheritance-case";
import {
  RULE_STATUSES,
  isSourceBackedRuleRecord,
  isVerifiedRuleRecord,
  type FiqhRuleRecord,
  type RuleClause,
  type RuleStatus,
} from "./rule-source";

export interface RuleRecordIssue {
  readonly path: string;
  readonly message: string;
}

export interface RuleFilter {
  readonly madhhab?: Madhhab;
  readonly statuses?: readonly RuleStatus[];
}

export class MalformedRuleRecordError extends Error {
  readonly issues: readonly RuleRecordIssue[];

  constructor(issues: readonly RuleRecordIssue[]) {
    super("The rule record is malformed.");
    this.name = "MalformedRuleRecordError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isRuleClause(value: unknown): value is RuleClause {
  return isRecord(value) && typeof value.description === "string" && isRecord(value.facts);
}

function requireNonEmptyText(
  record: Record<string, unknown>,
  property: string,
  issues: RuleRecordIssue[],
): void {
  const value = record[property];
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: property, message: `${property} must be a non-empty string.` });
  }
}

function validateNullableTextFields(
  record: Record<string, unknown>,
  issues: RuleRecordIssue[],
): void {
  const fields = [
    "kitabTitle",
    "author",
    "chapter",
    "section",
    "pdfPage",
    "printedPage",
    "exactArabicQuotation",
    "reviewer",
    "reviewDate",
  ] as const;

  for (const field of fields) {
    if (!isStringOrNull(record[field])) {
      issues.push({ path: field, message: `${field} must be a string or null.` });
    }
  }
}

export function validateRuleRecord(value: unknown): readonly RuleRecordIssue[] {
  if (!isRecord(value)) {
    return [{ path: "$", message: "Rule record must be an object." }];
  }

  const issues: RuleRecordIssue[] = [];

  requireNonEmptyText(value, "ruleId", issues);
  requireNonEmptyText(value, "explanation", issues);

  if (value.madhhab !== "SHAFII") {
    issues.push({ path: "madhhab", message: "Only the SHAFII madhhab is supported." });
  }

  if (typeof value.status !== "string" || !RULE_STATUSES.includes(value.status as RuleStatus)) {
    issues.push({ path: "status", message: "Rule status is not supported." });
  }

  if (
    !Array.isArray(value.heirsInvolved) ||
    !value.heirsInvolved.every((heir) => typeof heir === "string")
  ) {
    issues.push({ path: "heirsInvolved", message: "heirsInvolved must be a string array." });
  }

  if (
    !Array.isArray(value.conditions) ||
    !value.conditions.every((condition) => isRuleClause(condition))
  ) {
    issues.push({ path: "conditions", message: "conditions must contain valid rule clauses." });
  }

  if (
    !Array.isArray(value.exclusions) ||
    !value.exclusions.every((exclusion) => isRuleClause(exclusion))
  ) {
    issues.push({ path: "exclusions", message: "exclusions must contain valid rule clauses." });
  }

  if (!isRecord(value.result)) {
    issues.push({ path: "result", message: "result must be a structured object." });
  }

  if (typeof value.verificationNotes !== "string") {
    issues.push({
      path: "verificationNotes",
      message: "verificationNotes must be a string.",
    });
  }

  validateNullableTextFields(value, issues);

  if (issues.length === 0) {
    const rule = value as unknown as FiqhRuleRecord;
    if (rule.status === "VERIFIED" && !isVerifiedRuleRecord(rule)) {
      issues.push({
        path: "$",
        message:
          "VERIFIED rules require complete source location, Arabic quotation, reviewer, and review date.",
      });
    }
  }

  return issues;
}

export function assertValidRuleRecord(value: unknown): asserts value is FiqhRuleRecord {
  const issues = validateRuleRecord(value);
  if (issues.length > 0) {
    throw new MalformedRuleRecordError(issues);
  }
}

export class RuleRegistry {
  readonly #rulesById = new Map<string, FiqhRuleRecord>();

  constructor(rules: readonly unknown[] = []) {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  register(value: unknown): void {
    assertValidRuleRecord(value);

    if (this.#rulesById.has(value.ruleId)) {
      throw new RangeError(`Duplicate rule ID: ${value.ruleId}`);
    }

    this.#rulesById.set(value.ruleId, value);
  }

  getById(ruleId: string): FiqhRuleRecord | undefined {
    return this.#rulesById.get(ruleId);
  }

  filter(filter: RuleFilter = {}): readonly FiqhRuleRecord[] {
    return [...this.#rulesById.values()].filter(
      (rule) =>
        (filter.madhhab === undefined || rule.madhhab === filter.madhhab) &&
        (filter.statuses === undefined || filter.statuses.includes(rule.status)),
    );
  }

  getEligibleRules(mode: CalculationMode, madhhab: Madhhab): readonly FiqhRuleRecord[] {
    return this.filter({ madhhab }).filter((rule) => {
      if (mode === "VERIFIED") {
        return isVerifiedRuleRecord(rule);
      }

      return (
        isVerifiedRuleRecord(rule) ||
        (rule.status === "EXTRACTED_NOT_VERIFIED" && isSourceBackedRuleRecord(rule))
      );
    });
  }
}
