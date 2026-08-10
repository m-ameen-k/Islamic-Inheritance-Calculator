import type { HeirInput, HeirType } from "../domain/heirs";

export type AdvancedCaseDetection =
  | {
      readonly kind: "AKDARIYYA";
      readonly ruleId: string;
      readonly sisterType: "FULL_SISTER" | "PATERNAL_SISTER";
    }
  | {
      readonly kind: "MUSHTARAKA";
      readonly ruleId: "KZ-FR-018-MUSHTARAKA-CANONICAL";
      readonly ascendantType: "MOTHER" | "MATERNAL_GRANDMOTHER" | "PATERNAL_GRANDMOTHER";
    }
  | { readonly kind: "GRANDFATHER_WITH_SIBLINGS"; readonly muadda: false }
  | {
      readonly kind: "MUADDA";
      readonly muadda: true;
      readonly ruleId: "KZ-FR-022-MUADDA-FULL-MALE-LINE";
    }
  | { readonly kind: "UNSUPPORTED_ADVANCED"; readonly reason: string };

function normalizedCounts(heirs: readonly HeirInput[]): ReadonlyMap<HeirType, number> {
  const counts = new Map<HeirType, number>();
  for (const heir of heirs) counts.set(heir.type, (counts.get(heir.type) ?? 0) + heir.count);
  return counts;
}

export function detectAdvancedCase(heirs: readonly HeirInput[]): AdvancedCaseDetection | null {
  const counts = normalizedCounts(heirs);
  const count = (type: HeirType): number => counts.get(type) ?? 0;
  const active = [...counts.entries()].filter(([, value]) => value > 0);
  const exactTypes = (...types: readonly HeirType[]): boolean =>
    active.length === types.length && types.every((type) => count(type) > 0);

  const fullAkdariyya =
    exactTypes("HUSBAND", "MOTHER", "PATERNAL_GRANDFATHER", "FULL_SISTER") &&
    count("HUSBAND") === 1 &&
    count("MOTHER") === 1 &&
    count("PATERNAL_GRANDFATHER") === 1 &&
    count("FULL_SISTER") === 1;
  if (fullAkdariyya)
    return {
      kind: "AKDARIYYA",
      ruleId: "KZ-FR-023-AKDARIYYA-FULL-SISTER",
      sisterType: "FULL_SISTER",
    };
  const paternalAkdariyya =
    exactTypes("HUSBAND", "MOTHER", "PATERNAL_GRANDFATHER", "PATERNAL_SISTER") &&
    count("HUSBAND") === 1 &&
    count("MOTHER") === 1 &&
    count("PATERNAL_GRANDFATHER") === 1 &&
    count("PATERNAL_SISTER") === 1;
  if (paternalAkdariyya)
    return {
      kind: "AKDARIYYA",
      ruleId: "KZ-FR-023-AKDARIYYA-PATERNAL-SISTER",
      sisterType: "PATERNAL_SISTER",
    };

  const ascendants = ["MOTHER", "MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"] as const;
  const selectedAscendants = ascendants.filter((type) => count(type) > 0);
  const uterineCount = count("MATERNAL_BROTHER") + count("MATERNAL_SISTER");
  const mushtarakaShape =
    count("HUSBAND") === 1 &&
    selectedAscendants.length === 1 &&
    uterineCount >= 2 &&
    count("FULL_BROTHER") > 0;
  if (mushtarakaShape) {
    const canonical =
      uterineCount === 2 &&
      count("FULL_BROTHER") === 1 &&
      count("FULL_SISTER") === 0 &&
      active.every(([type]) =>
        [
          "HUSBAND",
          selectedAscendants[0],
          "MATERNAL_BROTHER",
          "MATERNAL_SISTER",
          "FULL_BROTHER",
        ].includes(type),
      );
    if (canonical) {
      const ascendantType = selectedAscendants[0];
      if (ascendantType === undefined) throw new Error("Canonical Mushtaraka needs an ascendant.");
      return {
        kind: "MUSHTARAKA",
        ruleId: "KZ-FR-018-MUSHTARAKA-CANONICAL",
        ascendantType,
      };
    }
    return { kind: "UNSUPPORTED_ADVANCED", reason: "MUSHTARAKA_VARIANT_NOT_ADMITTED" };
  }

  const hasGrandfather = count("PATERNAL_GRANDFATHER") === 1 && count("FATHER") === 0;
  const hasMaleDescendant = count("SON") + count("SONS_SON") > 0;
  const fullCount = count("FULL_BROTHER") + count("FULL_SISTER");
  const paternalCount = count("PATERNAL_BROTHER") + count("PATERNAL_SISTER");
  if (hasGrandfather && !hasMaleDescendant && fullCount + paternalCount > 0) {
    if (fullCount > 0 && paternalCount > 0) {
      if (count("FULL_BROTHER") > 0)
        return {
          kind: "MUADDA",
          muadda: true,
          ruleId: "KZ-FR-022-MUADDA-FULL-MALE-LINE",
        };
      return { kind: "UNSUPPORTED_ADVANCED", reason: "MUADDA_FEMALE_BRANCH_NOT_ADMITTED" };
    }
    return { kind: "GRANDFATHER_WITH_SIBLINGS", muadda: false };
  }
  return null;
}
