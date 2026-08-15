import { describe, expect, it } from "vitest";

import type { HeirInput } from "../../src/domain/heirs.ts";
import {
  descendantGeneration,
  grandmotherDegree,
  lineageKey,
  normalizeLineageAwareHeirs,
} from "../../src/domain/lineage.ts";

const heir = (value: HeirInput): HeirInput => value;

describe("TECHNICAL_TEST: lineage-aware heir normalization", () => {
  it("normalizes legacy first-generation inputs identically to explicit source-valid paths", () => {
    const legacy = normalizeLineageAwareHeirs([
      heir({ heirId: "legacy", type: "SONS_SON", count: 2 }),
      heir({ heirId: "legacy-f", type: "SONS_DAUGHTER", count: 1 }),
    ]);
    const explicit = normalizeLineageAwareHeirs([
      heir({
        heirId: "explicit",
        type: "SONS_SON",
        count: 2,
        lineage: { kind: "SON_LINE_DESCENDANT", path: ["SON", "SON"] },
      }),
      heir({
        heirId: "explicit-f",
        type: "SONS_DAUGHTER",
        count: 1,
        lineage: { kind: "SON_LINE_DESCENDANT", path: ["SON", "DAUGHTER"] },
      }),
    ]);
    expect(legacy).toEqual(explicit);
    expect(legacy.heirs.map(descendantGeneration)).toEqual([1, 1]);
  });

  it("preserves distinct descendant generations instead of merging them", () => {
    const normalized = normalizeLineageAwareHeirs([
      heir({
        heirId: "near",
        type: "SONS_SON",
        count: 1,
        lineage: { kind: "SON_LINE_DESCENDANT", path: ["SON", "SON"] },
      }),
      heir({
        heirId: "far",
        type: "SONS_SON",
        count: 1,
        lineage: { kind: "SON_LINE_DESCENDANT", path: ["SON", "SON", "SON"] },
      }),
    ]);
    expect(normalized.heirs.map(lineageKey)).toEqual(["SONS_SON:SON>SON", "SONS_SON:SON>SON>SON"]);
  });

  it("rejects invalid and ambiguous descendant paths", () => {
    const invalid = normalizeLineageAwareHeirs([
      heir({
        heirId: "invalid",
        type: "SONS_DAUGHTER",
        count: 1,
        lineage: { kind: "SON_LINE_DESCENDANT", path: ["DAUGHTER", "DAUGHTER"] },
      }),
    ]);
    expect(invalid.issues.map(({ code }) => code)).toEqual(["DESCENDANT_LINEAGE_INVALID"]);

    const ambiguous = normalizeLineageAwareHeirs([
      { heirId: "ambiguous", type: "SONS_SON", count: 1, lineage: null } as unknown as HeirInput,
    ]);
    expect(ambiguous.issues.map(({ code }) => code)).toEqual(["DESCENDANT_LINEAGE_AMBIGUOUS"]);
  });

  it("accepts only source-valid grandmother routes and retains their degree", () => {
    const normalized = normalizeLineageAwareHeirs([
      heir({
        heirId: "maternal-far",
        type: "MATERNAL_GRANDMOTHER",
        count: 1,
        lineage: { kind: "GRANDMOTHER", path: ["MOTHER", "MOTHER", "MOTHER"] },
      }),
      heir({
        heirId: "paternal-far",
        type: "PATERNAL_GRANDMOTHER",
        count: 1,
        lineage: { kind: "GRANDMOTHER", path: ["FATHER", "FATHER", "MOTHER"] },
      }),
    ]);
    expect(normalized.issues).toEqual([]);
    expect(normalized.heirs.map(grandmotherDegree)).toEqual([3, 3]);

    const invalid = normalizeLineageAwareHeirs([
      heir({
        heirId: "invalid-route",
        type: "MATERNAL_GRANDMOTHER",
        count: 1,
        lineage: { kind: "GRANDMOTHER", path: ["MOTHER", "FATHER", "MOTHER"] },
      }),
    ]);
    expect(invalid.issues.map(({ code }) => code)).toEqual(["GRANDMOTHER_LINEAGE_INVALID"]);
  });
});
