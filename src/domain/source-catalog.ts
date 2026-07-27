export interface PrintedPageMapEntry {
  readonly sectionTitle: string;
  readonly printedPage: string;
}

export interface BibliographicSourceRecord {
  readonly sourceId: string;
  readonly title: string;
  readonly author: string;
  readonly authorDates: string;
  readonly preparedOrEditedBy: string;
  readonly publisher: string;
  readonly publicationPlace: string;
  readonly edition: string;
  readonly publicationDateAh: string;
  readonly publicationDateCe: string;
  readonly isbn: string;
  readonly physicalVolume: string;
  readonly internalPart: string;
  readonly relevantChapter: string;
  readonly printedPageMap: readonly PrintedPageMapEntry[];
}

export interface BibliographicSourceIssue {
  readonly path: string;
  readonly message: string;
}

export class MalformedBibliographicSourceError extends Error {
  readonly issues: readonly BibliographicSourceIssue[];

  constructor(issues: readonly BibliographicSourceIssue[]) {
    super("The bibliographic source record is malformed.");
    this.name = "MalformedBibliographicSourceError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireText(
  record: Record<string, unknown>,
  property: string,
  issues: BibliographicSourceIssue[],
): void {
  const value = record[property];
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: property, message: `${property} must be a non-empty string.` });
  }
}

export function validateBibliographicSource(value: unknown): readonly BibliographicSourceIssue[] {
  if (!isRecord(value)) {
    return [{ path: "$", message: "Bibliographic source must be an object." }];
  }

  const issues: BibliographicSourceIssue[] = [];
  const requiredTextFields = [
    "sourceId",
    "title",
    "author",
    "authorDates",
    "preparedOrEditedBy",
    "publisher",
    "publicationPlace",
    "edition",
    "publicationDateAh",
    "publicationDateCe",
    "isbn",
    "physicalVolume",
    "internalPart",
    "relevantChapter",
  ] as const;

  for (const field of requiredTextFields) {
    requireText(value, field, issues);
  }

  if (!Array.isArray(value.printedPageMap) || value.printedPageMap.length === 0) {
    issues.push({
      path: "printedPageMap",
      message: "printedPageMap must contain at least one entry.",
    });
  } else {
    for (const [index, entry] of value.printedPageMap.entries()) {
      if (!isRecord(entry)) {
        issues.push({
          path: `printedPageMap[${index}]`,
          message: "Printed-page entry must be an object.",
        });
        continue;
      }
      requireText(entry, "sectionTitle", issues);
      if (typeof entry.printedPage !== "string" || !/^[1-9]\d*$/.test(entry.printedPage)) {
        issues.push({
          path: `printedPageMap[${index}].printedPage`,
          message: "Printed page must be a positive integer string.",
        });
      }
    }
  }

  return issues;
}

export function assertValidBibliographicSource(
  value: unknown,
): asserts value is BibliographicSourceRecord {
  const issues = validateBibliographicSource(value);
  if (issues.length > 0) {
    throw new MalformedBibliographicSourceError(issues);
  }
}

export class BibliographicSourceCatalog {
  readonly #sourcesById = new Map<string, BibliographicSourceRecord>();

  constructor(sources: readonly unknown[] = []) {
    for (const source of sources) {
      this.register(source);
    }
  }

  register(value: unknown): void {
    assertValidBibliographicSource(value);

    if (this.#sourcesById.has(value.sourceId)) {
      throw new RangeError(`Duplicate source ID: ${value.sourceId}`);
    }

    this.#sourcesById.set(value.sourceId, value);
  }

  getById(sourceId: string): BibliographicSourceRecord | undefined {
    return this.#sourcesById.get(sourceId);
  }

  list(): readonly BibliographicSourceRecord[] {
    return [...this.#sourcesById.values()];
  }
}
