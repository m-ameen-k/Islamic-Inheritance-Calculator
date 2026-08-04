import type { EstateObligationType } from "../domain/estate";
import type { HeirType } from "../domain/heirs";
import type { InheritanceCase } from "../domain/inheritance-case";
import type { InputValidationIssue } from "../domain/result";

const HEIR_TYPES = new Set<HeirType>([
  "HUSBAND",
  "WIFE",
  "FATHER",
  "MOTHER",
  "SON",
  "DAUGHTER",
  "SONS_SON",
  "SONS_DAUGHTER",
  "PATERNAL_GRANDFATHER",
  "PATERNAL_GRANDMOTHER",
  "MATERNAL_GRANDMOTHER",
  "FULL_BROTHER",
  "PATERNAL_BROTHER",
  "MATERNAL_BROTHER",
  "FULL_SISTER",
  "PATERNAL_SISTER",
  "MATERNAL_SISTER",
  "FULL_BROTHERS_SON",
  "PATERNAL_BROTHERS_SON",
  "FULL_PATERNAL_UNCLE",
  "PATERNAL_UNCLE",
  "FULL_PATERNAL_UNCLES_SON",
  "PATERNAL_UNCLES_SON",
  "MALE_EMANCIPATOR",
  "FEMALE_EMANCIPATOR",
]);

const OBLIGATION_TYPES = new Set<EstateObligationType>([
  "FUNERAL_EXPENSE",
  "DEBT",
  "UNPAID_RELIGIOUS_OBLIGATION",
  "OTHER",
]);

export type CaseValidationIssue = InputValidationIssue;

export interface CaseValidation {
  readonly valid: boolean;
  readonly issues: readonly CaseValidationIssue[];
}

function isNonNegativeMinorUnits(value: string): boolean {
  return /^(0|[1-9]\d*)$/.test(value);
}

function addDuplicateIssues(
  values: readonly string[],
  path: string,
  issues: CaseValidationIssue[],
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      issues.push({
        path,
        code: "DUPLICATE_ID",
        message: `Duplicate identifier: ${value}`,
      });
    }
    seen.add(value);
  }
}

export function validateCase(input: InheritanceCase): CaseValidation {
  const issues: CaseValidationIssue[] = [];

  if (input.caseId.length === 0) {
    issues.push({ path: "caseId", code: "REQUIRED", message: "Case ID is required." });
  }
  if (input.madhhab !== "SHAFII") {
    issues.push({
      path: "madhhab",
      code: "UNSUPPORTED_VALUE",
      message: "Only the SHAFII madhhab is supported.",
    });
  }
  if (input.mode !== "VERIFIED" && input.mode !== "RESEARCH") {
    issues.push({
      path: "mode",
      code: "UNSUPPORTED_VALUE",
      message: "Calculation mode is not supported.",
    });
  }
  if (input.deceasedSex !== "MALE" && input.deceasedSex !== "FEMALE") {
    issues.push({
      path: "deceasedSex",
      code: "UNSUPPORTED_VALUE",
      message: "Deceased sex must be MALE or FEMALE.",
    });
  }
  if (!/^[A-Z]{3}$/.test(input.estate.currencyCode)) {
    issues.push({
      path: "estate.currencyCode",
      code: "UNSUPPORTED_VALUE",
      message: "Currency code must contain three ASCII letters.",
    });
  }
  if (!isNonNegativeMinorUnits(input.estate.grossEstateMinorUnits)) {
    issues.push({
      path: "estate.grossEstateMinorUnits",
      code: "INVALID_MINOR_UNITS",
      message: "Gross estate minor units must be a non-negative integer string.",
    });
  }

  addDuplicateIssues(
    input.estate.obligations.map((obligation) => obligation.obligationId),
    "estate.obligations",
    issues,
  );
  for (const [index, obligation] of input.estate.obligations.entries()) {
    if (obligation.obligationId.length === 0) {
      issues.push({
        path: `estate.obligations[${index}].obligationId`,
        code: "REQUIRED",
        message: "Obligation ID is required.",
      });
    }
    if (!OBLIGATION_TYPES.has(obligation.type)) {
      issues.push({
        path: `estate.obligations[${index}].type`,
        code: "UNSUPPORTED_VALUE",
        message: "Estate obligation type is not supported.",
      });
    }
    if (!isNonNegativeMinorUnits(obligation.amountMinorUnits)) {
      issues.push({
        path: `estate.obligations[${index}].amountMinorUnits`,
        code: "INVALID_MINOR_UNITS",
        message: "Obligation minor units must be a non-negative integer string.",
      });
    }
  }

  if (
    input.estate.wasiyyah !== null &&
    !isNonNegativeMinorUnits(input.estate.wasiyyah.amountMinorUnits)
  ) {
    issues.push({
      path: "estate.wasiyyah.amountMinorUnits",
      code: "INVALID_MINOR_UNITS",
      message: "Wasiyyah minor units must be a non-negative integer string.",
    });
  }

  addDuplicateIssues(
    input.heirs.map((heir) => heir.heirId),
    "heirs",
    issues,
  );
  for (const [index, heir] of input.heirs.entries()) {
    if (heir.heirId.length === 0) {
      issues.push({
        path: `heirs[${index}].heirId`,
        code: "REQUIRED",
        message: "Heir ID is required.",
      });
    }
    if (!HEIR_TYPES.has(heir.type)) {
      issues.push({
        path: `heirs[${index}].type`,
        code: "UNSUPPORTED_VALUE",
        message: "Heir type is not supported.",
      });
    }
    if (!Number.isSafeInteger(heir.count) || heir.count <= 0) {
      issues.push({
        path: `heirs[${index}].count`,
        code: "INVALID_COUNT",
        message: "Heir count must be a positive safe integer.",
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
