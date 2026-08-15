import type {
  GrandmotherLineage,
  GrandmotherLineageStep,
  HeirInput,
  HeirLineage,
  HeirType,
  SonLineDescendantLineage,
  SonLineStep,
} from "./heirs.ts";

const SON_LINE_TYPES = new Set<HeirType>(["SONS_SON", "SONS_DAUGHTER"]);
const GRANDMOTHER_TYPES = new Set<HeirType>(["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"]);

export type LineageIssueCode =
  | "DESCENDANT_LINEAGE_INVALID"
  | "DESCENDANT_LINEAGE_AMBIGUOUS"
  | "GRANDMOTHER_LINEAGE_INVALID"
  | "GRANDMOTHER_LINEAGE_AMBIGUOUS";

export interface LineageIssue {
  readonly index: number;
  readonly heirId: string;
  readonly code: LineageIssueCode;
}

export interface NormalizedLineageHeirs {
  readonly heirs: readonly HeirInput[];
  readonly issues: readonly LineageIssue[];
}

const legacyLineage = (type: HeirType): HeirLineage | undefined => {
  if (type === "SONS_SON") return { kind: "SON_LINE_DESCENDANT", path: ["SON", "SON"] };
  if (type === "SONS_DAUGHTER") return { kind: "SON_LINE_DESCENDANT", path: ["SON", "DAUGHTER"] };
  if (type === "MATERNAL_GRANDMOTHER") return { kind: "GRANDMOTHER", path: ["MOTHER", "MOTHER"] };
  if (type === "PATERNAL_GRANDMOTHER") return { kind: "GRANDMOTHER", path: ["FATHER", "MOTHER"] };
  return undefined;
};

const isSonLineStep = (value: unknown): value is SonLineStep =>
  value === "SON" || value === "DAUGHTER";
const isGrandmotherStep = (value: unknown): value is GrandmotherLineageStep =>
  value === "FATHER" || value === "MOTHER";

function normalizeSonLine(
  type: HeirType,
  raw: unknown,
): { lineage?: SonLineDescendantLineage; issue?: LineageIssueCode } {
  if (raw === undefined) return { lineage: legacyLineage(type) as SonLineDescendantLineage };
  if (raw === null || typeof raw !== "object") return { issue: "DESCENDANT_LINEAGE_AMBIGUOUS" };
  const candidate = raw as { kind?: unknown; path?: unknown };
  if (candidate.kind !== "SON_LINE_DESCENDANT" || !Array.isArray(candidate.path))
    return { issue: "DESCENDANT_LINEAGE_AMBIGUOUS" };
  const path = candidate.path;
  if (
    path.length < 2 ||
    !path.every(isSonLineStep) ||
    path.slice(0, -1).some((step) => step !== "SON") ||
    (type === "SONS_SON" && path.at(-1) !== "SON") ||
    (type === "SONS_DAUGHTER" && path.at(-1) !== "DAUGHTER")
  )
    return { issue: "DESCENDANT_LINEAGE_INVALID" };
  return { lineage: { kind: "SON_LINE_DESCENDANT", path: [...path] } };
}

function normalizeGrandmother(
  type: HeirType,
  raw: unknown,
): { lineage?: GrandmotherLineage; issue?: LineageIssueCode } {
  if (raw === undefined) return { lineage: legacyLineage(type) as GrandmotherLineage };
  if (raw === null || typeof raw !== "object") return { issue: "GRANDMOTHER_LINEAGE_AMBIGUOUS" };
  const candidate = raw as { kind?: unknown; path?: unknown };
  if (candidate.kind !== "GRANDMOTHER" || !Array.isArray(candidate.path))
    return { issue: "GRANDMOTHER_LINEAGE_AMBIGUOUS" };
  const path = candidate.path;
  const firstMother = path.indexOf("MOTHER");
  const validRoute =
    path.length >= 2 &&
    path.every(isGrandmotherStep) &&
    path.at(-1) === "MOTHER" &&
    firstMother >= 0 &&
    path.slice(firstMother).every((step) => step === "MOTHER");
  const expectedFirst = type === "MATERNAL_GRANDMOTHER" ? "MOTHER" : "FATHER";
  if (!validRoute || path[0] !== expectedFirst) return { issue: "GRANDMOTHER_LINEAGE_INVALID" };
  return { lineage: { kind: "GRANDMOTHER", path: [...path] } };
}

export function lineageKey(heir: Pick<HeirInput, "type" | "lineage">): string {
  if (heir.lineage === undefined) return heir.type;
  return `${heir.type}:${heir.lineage.path.join(">")}`;
}

export function descendantGeneration(heir: Pick<HeirInput, "type" | "lineage">): number | null {
  return heir.lineage?.kind === "SON_LINE_DESCENDANT" ? heir.lineage.path.length - 1 : null;
}

export function grandmotherDegree(heir: Pick<HeirInput, "type" | "lineage">): number | null {
  return heir.lineage?.kind === "GRANDMOTHER" ? heir.lineage.path.length : null;
}

export function lineageDescription(heir: Pick<HeirInput, "type" | "lineage">): string {
  if (heir.lineage?.kind === "SON_LINE_DESCENDANT") {
    const generation = heir.lineage.path.length - 1;
    return `${heir.type === "SONS_SON" ? "male" : "female"} son-line descendant, generation ${generation}`;
  }
  if (heir.lineage?.kind === "GRANDMOTHER")
    return `${heir.type === "MATERNAL_GRANDMOTHER" ? "maternal" : "paternal"} grandmother, degree ${heir.lineage.path.length}`;
  return heir.type;
}

/** Pure, deterministic normalization. It never infers an invalid ancestry route. */
export function normalizeLineageAwareHeirs(input: readonly HeirInput[]): NormalizedLineageHeirs {
  const issues: LineageIssue[] = [];
  const groups = new Map<string, HeirInput>();
  input.forEach((heir, index) => {
    let lineage: HeirLineage | undefined;
    let issue: LineageIssueCode | undefined;
    if (SON_LINE_TYPES.has(heir.type))
      ({ lineage, issue } = normalizeSonLine(heir.type, heir.lineage));
    else if (GRANDMOTHER_TYPES.has(heir.type))
      ({ lineage, issue } = normalizeGrandmother(heir.type, heir.lineage));
    else if (heir.lineage !== undefined) issue = "DESCENDANT_LINEAGE_INVALID";
    if (issue !== undefined) {
      issues.push({ index, heirId: heir.heirId.trim(), code: issue });
      return;
    }
    const normalized: HeirInput = {
      heirId: heir.heirId.trim(),
      type: heir.type,
      count: heir.count,
      ...(lineage === undefined ? {} : { lineage }),
    };
    const key = lineageKey(normalized);
    const current = groups.get(key);
    groups.set(key, {
      ...normalized,
      heirId: key.toLowerCase().replaceAll(">", "-"),
      count: (current?.count ?? 0) + heir.count,
    });
  });
  return {
    heirs: [...groups.values()]
      .filter(({ count }) => count > 0)
      .sort((left, right) => lineageKey(left).localeCompare(lineageKey(right))),
    issues,
  };
}
