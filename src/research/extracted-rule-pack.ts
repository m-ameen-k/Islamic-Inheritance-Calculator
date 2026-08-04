import type {
  BibliographicSourceCatalog,
  BibliographicSourceRecord,
} from "../domain/source-catalog";

export type ExtractedRuleStatus = "EXTRACTED_NOT_VERIFIED";

export interface ExtractedPackSource {
  readonly sourceId: string;
  readonly arabicTitle: string;
  readonly author: string;
  readonly authorDatesAh: string;
  readonly preparedOrEditedBy: string;
  readonly publisher: string;
  readonly publicationPlace: string;
  readonly edition: string;
  readonly publicationDate: string;
  readonly isbn: string;
  readonly physicalVolume: string;
  readonly internalPart: string;
  readonly chapter: string;
  readonly localFileReference: string;
  readonly bibliographyEvidenceFileReference: string;
  readonly notes: string;
}

export interface CandidateTestMetadata {
  readonly caseDescription: string;
  readonly shareField: "expected_shares" | "derived_exact_shares";
  readonly exactShares: Readonly<Record<string, string>>;
  readonly derivationStatus: string | null;
  readonly classification: "METADATA_ONLY";
  readonly executable: false;
}

export interface ExtractedRuleResearchRecord {
  readonly ruleId: string;
  readonly sourceId: string;
  readonly topic: string;
  readonly status: ExtractedRuleStatus;
  readonly printedPages: readonly number[];
  readonly localPdfPages: readonly number[];
  readonly arabicExcerpt: string;
  readonly sourceSummary: string;
  readonly conditions: readonly string[];
  readonly outcomeNotes: readonly string[];
  readonly implementationScope: string;
  readonly candidateTests: readonly CandidateTestMetadata[];
  readonly reviewQuestions: readonly string[];
}

export interface ExtractedRulePack {
  readonly schemaVersion: "0.1";
  readonly packStatus: ExtractedRuleStatus;
  readonly safeForDistribution: false;
  readonly createdFor: string;
  readonly source: ExtractedPackSource;
  readonly bibliography: BibliographicSourceRecord;
  readonly rules: readonly ExtractedRuleResearchRecord[];
  readonly globalWarnings: readonly string[];
}

export class ExtractedRulePackDecodeError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`Invalid extracted rule pack at ${path}: ${message}`);
    this.name = "ExtractedRulePackDecodeError";
    this.path = path;
  }
}

function fail(path: string, message: string): never {
  throw new ExtractedRulePackDecodeError(path, message);
}

function decodeObject(
  value: unknown,
  path: string,
  allowedFields: ReadonlySet<string>,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(path, "expected an object");
  }

  const record = value as Record<string, unknown>;
  for (const field of Object.keys(record)) {
    if (!allowedFields.has(field)) {
      fail(`${path}.${field}`, "unknown field");
    }
  }
  return record;
}

function decodeOpenObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(path, "expected an object");
  }
  return value as Record<string, unknown>;
}

function decodeString(value: unknown, path: string, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.trim().length === 0)) {
    return fail(path, allowEmpty ? "expected a string" : "expected a non-empty string");
  }
  return value;
}

function decodeStringArray(value: unknown, path: string): readonly string[] {
  if (!Array.isArray(value)) {
    return fail(path, "expected an array");
  }
  return value.map((item, index) => decodeString(item, `${path}[${index}]`));
}

function decodePositiveIntegerArray(value: unknown, path: string): readonly number[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fail(path, "expected a non-empty array");
  }
  return value.map((item, index) => {
    if (typeof item !== "number" || !Number.isSafeInteger(item) || item <= 0) {
      return fail(`${path}[${index}]`, "expected a positive safe integer");
    }
    return item;
  });
}

function decodeExactFraction(value: unknown, path: string): string {
  const fraction = decodeString(value, path);
  if (!/^(0|[1-9]\d*)\/[1-9]\d*$/.test(fraction)) {
    return fail(path, "expected an exact non-negative fraction such as 1/2");
  }
  return fraction;
}

function decodeCandidateShares(value: unknown, path: string): Readonly<Record<string, string>> {
  const record = decodeOpenObject(value, path);
  const entries = Object.entries(record);
  if (entries.length === 0) {
    return fail(path, "candidate share map cannot be empty");
  }

  return Object.fromEntries(
    entries.map(([heir, fraction]) => {
      if (heir.trim().length === 0) {
        fail(path, "candidate share key cannot be empty");
      }
      return [heir, decodeExactFraction(fraction, `${path}.${heir}`)];
    }),
  );
}

const CANDIDATE_FIELDS = new Set([
  "case",
  "expected_shares",
  "derived_exact_shares",
  "derivation_status",
]);

function decodeCandidateTest(value: unknown, path: string): CandidateTestMetadata {
  const record = decodeObject(value, path, CANDIDATE_FIELDS);
  const hasExpected = record.expected_shares !== undefined;
  const hasDerived = record.derived_exact_shares !== undefined;
  if (hasExpected === hasDerived) {
    return fail(path, "exactly one candidate share field is required");
  }

  const shareField = hasExpected ? "expected_shares" : "derived_exact_shares";
  return {
    caseDescription: decodeString(record.case, `${path}.case`),
    shareField,
    exactShares: decodeCandidateShares(record[shareField], `${path}.${shareField}`),
    derivationStatus:
      record.derivation_status === undefined
        ? null
        : decodeString(record.derivation_status, `${path}.derivation_status`),
    classification: "METADATA_ONLY",
    executable: false,
  };
}

const RULE_FIELDS = new Set([
  "rule_id",
  "topic",
  "status",
  "printed_pages",
  "local_pdf_pages",
  "arabic_excerpt",
  "source_summary",
  "conditions",
  "outcome",
  "implementation_scope",
  "candidate_tests",
  "review_questions",
]);

function decodeRule(value: unknown, path: string, sourceId: string): ExtractedRuleResearchRecord {
  const record = decodeObject(value, path, RULE_FIELDS);
  if (record.status !== "EXTRACTED_NOT_VERIFIED") {
    return fail(`${path}.status`, "only EXTRACTED_NOT_VERIFIED is supported");
  }

  const candidateTests =
    record.candidate_tests === undefined
      ? []
      : Array.isArray(record.candidate_tests)
        ? record.candidate_tests.map((test, index) =>
            decodeCandidateTest(test, `${path}.candidate_tests[${index}]`),
          )
        : fail(`${path}.candidate_tests`, "expected an array");

  return {
    ruleId: decodeString(record.rule_id, `${path}.rule_id`),
    sourceId,
    topic: decodeString(record.topic, `${path}.topic`),
    status: "EXTRACTED_NOT_VERIFIED",
    printedPages: decodePositiveIntegerArray(record.printed_pages, `${path}.printed_pages`),
    localPdfPages: decodePositiveIntegerArray(record.local_pdf_pages, `${path}.local_pdf_pages`),
    arabicExcerpt: decodeString(record.arabic_excerpt, `${path}.arabic_excerpt`),
    sourceSummary: decodeString(record.source_summary, `${path}.source_summary`),
    conditions: decodeStringArray(record.conditions, `${path}.conditions`),
    outcomeNotes: decodeStringArray(record.outcome, `${path}.outcome`),
    implementationScope: decodeString(record.implementation_scope, `${path}.implementation_scope`),
    candidateTests,
    reviewQuestions: decodeStringArray(record.review_questions, `${path}.review_questions`),
  };
}

const SOURCE_FIELDS = new Set([
  "source_id",
  "arabic_title",
  "author",
  "author_dates_ah",
  "prepared_or_edited_by",
  "publisher",
  "publication_place",
  "edition",
  "publication_date",
  "isbn",
  "physical_volume",
  "internal_part",
  "chapter",
  "local_file",
  "bibliography_evidence_file",
  "notes",
]);

function decodeSource(
  value: unknown,
  catalog: BibliographicSourceCatalog,
): { readonly source: ExtractedPackSource; readonly bibliography: BibliographicSourceRecord } {
  const record = decodeObject(value, "$.source", SOURCE_FIELDS);
  const sourceId = decodeString(record.source_id, "$.source.source_id");
  const bibliography = catalog.getById(sourceId);
  if (bibliography === undefined) {
    return fail("$.source.source_id", "source ID is absent from the bibliography catalog");
  }
  if (
    bibliography.metadataCompleteness !== "COMPLETE" ||
    bibliography.preparedOrEditedBy === null ||
    bibliography.isbn === null ||
    bibliography.physicalVolume === null ||
    bibliography.internalPart === null ||
    bibliography.relevantChapter === null
  ) {
    return fail(
      "$.source.source_id",
      "source does not have the complete bibliography required by an extracted rule pack",
    );
  }

  const source: ExtractedPackSource = {
    sourceId,
    arabicTitle: decodeString(record.arabic_title, "$.source.arabic_title"),
    author: decodeString(record.author, "$.source.author"),
    authorDatesAh: decodeString(record.author_dates_ah, "$.source.author_dates_ah"),
    preparedOrEditedBy: decodeString(
      record.prepared_or_edited_by,
      "$.source.prepared_or_edited_by",
    ),
    publisher: decodeString(record.publisher, "$.source.publisher"),
    publicationPlace: decodeString(record.publication_place, "$.source.publication_place"),
    edition: decodeString(record.edition, "$.source.edition"),
    publicationDate: decodeString(record.publication_date, "$.source.publication_date"),
    isbn: decodeString(record.isbn, "$.source.isbn"),
    physicalVolume: decodeString(record.physical_volume, "$.source.physical_volume"),
    internalPart: decodeString(record.internal_part, "$.source.internal_part"),
    chapter: decodeString(record.chapter, "$.source.chapter"),
    localFileReference: decodeString(record.local_file, "$.source.local_file"),
    bibliographyEvidenceFileReference: decodeString(
      record.bibliography_evidence_file,
      "$.source.bibliography_evidence_file",
    ),
    notes: decodeString(record.notes, "$.source.notes"),
  };

  const stableMatches: readonly [string, string, string][] = [
    ["arabic_title", source.arabicTitle, bibliography.title],
    ["author", source.author, bibliography.author],
    ["prepared_or_edited_by", source.preparedOrEditedBy, bibliography.preparedOrEditedBy],
    ["publisher", source.publisher, bibliography.publisher],
    ["isbn", source.isbn, bibliography.isbn],
    ["physical_volume", source.physicalVolume, bibliography.physicalVolume],
    ["internal_part", source.internalPart, bibliography.internalPart],
    ["chapter", source.chapter, bibliography.relevantChapter],
  ];
  for (const [field, actual, expected] of stableMatches) {
    if (actual !== expected) {
      fail(`$.source.${field}`, "does not match the confirmed bibliography record");
    }
  }

  return { source, bibliography };
}

const PACK_FIELDS = new Set([
  "schema_version",
  "pack_status",
  "safe_for_distribution",
  "created_for",
  "source",
  "rules",
  "global_warnings",
]);

export function decodeExtractedRulePack(
  value: unknown,
  catalog: BibliographicSourceCatalog,
): ExtractedRulePack {
  const record = decodeObject(value, "$", PACK_FIELDS);
  if (record.schema_version !== "0.1") {
    return fail("$.schema_version", "only schema version 0.1 is supported");
  }
  if (record.pack_status !== "EXTRACTED_NOT_VERIFIED") {
    return fail("$.pack_status", "only EXTRACTED_NOT_VERIFIED is supported");
  }
  if (record.safe_for_distribution !== false) {
    return fail("$.safe_for_distribution", "must be false");
  }

  const { source, bibliography } = decodeSource(record.source, catalog);
  if (!Array.isArray(record.rules)) {
    return fail("$.rules", "expected an array");
  }
  const rules = record.rules.map((rule, index) =>
    decodeRule(rule, `$.rules[${index}]`, source.sourceId),
  );
  const seenRuleIds = new Set<string>();
  for (const [index, rule] of rules.entries()) {
    if (seenRuleIds.has(rule.ruleId)) {
      fail(`$.rules[${index}].rule_id`, `duplicate rule ID: ${rule.ruleId}`);
    }
    seenRuleIds.add(rule.ruleId);
  }

  return {
    schemaVersion: "0.1",
    packStatus: "EXTRACTED_NOT_VERIFIED",
    safeForDistribution: false,
    createdFor: decodeString(record.created_for, "$.created_for"),
    source,
    bibliography,
    rules,
    globalWarnings: decodeStringArray(record.global_warnings, "$.global_warnings"),
  };
}
