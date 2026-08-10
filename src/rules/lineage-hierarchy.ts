import type { HeirInput, HeirType } from "../domain/heirs.ts";
import {
  descendantGeneration,
  grandmotherDegree,
  lineageDescription,
  lineageKey,
  normalizeLineageAwareHeirs,
  type LineageIssueCode,
} from "../domain/lineage.ts";

export const LINEAGE_RULE_IDS = {
  directSonBlocks: "KZ-FR-013-DIRECT-SON-BLOCKS-SON-LINE-DESCENDANTS",
  nearerMaleBlocks: "KZ-FR-013-NEARER-MALE-DESCENDANT-BLOCKS-FARTHER",
  nearerFemaleBlocks: "KZ-FR-013-NEARER-FEMALE-DESCENDANT-BLOCKS-FARTHER",
  deeperMaleResidue: "KZ-FR-013-DEEPER-MALE-DESCENDANT-RESIDUARY",
  deeperFemaleHalf: "KZ-FR-013-DEEPER-FEMALE-DESCENDANT-ONE-HALF",
  deeperFemaleTwoThirds: "KZ-FR-013-DEEPER-FEMALE-DESCENDANT-GROUP-TWO-THIRDS",
  deeperFemaleComplement: "KZ-FR-013-DEEPER-FEMALE-DESCENDANT-COMPLEMENT-ONE-SIXTH",
  descendantTwoToOne: "KZ-FR-013-LINEAGE-DESCENDANTS-TWO-TO-ONE",
  grandmotherShare: "KZ-FR-017-LINEAGE-GRANDMOTHER-GROUP-ONE-SIXTH",
  motherBlocksGrandmothers: "KZ-FR-017-MOTHER-BLOCKS-LINEAGE-GRANDMOTHERS",
  nearerGrandmotherBlocks: "KZ-FR-017-NEARER-GRANDMOTHER-BLOCKS-FARTHER",
  maternalGrandmotherPriority: "KZ-FR-017-NEARER-MATERNAL-GRANDMOTHER-BLOCKS-FARTHER-PATERNAL",
  maleAscendantBlocksOwnMother: "KZ-FR-017-MALE-ASCENDANT-BLOCKS-OWN-MOTHER",
} as const;

export type LineageProductionRuleId = (typeof LINEAGE_RULE_IDS)[keyof typeof LINEAGE_RULE_IDS];
type LineageHierarchyRuleId =
  | LineageProductionRuleId
  | "KZ-FR-011-SON-BLOCKS-SONS-SON"
  | "KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER"
  | "KZ-FR-017-MOTHER-BLOCKS-GRANDMOTHER-GROUP"
  | "KZ-FR-017-FATHER-BLOCKS-PATERNAL-GRANDMOTHER";

export interface LineageBlockedHeir {
  readonly blockedHeirId: string;
  readonly type: HeirType;
  readonly count: number;
  readonly blockerHeirId: string;
  readonly blockerType: HeirType;
  readonly ruleId: LineageHierarchyRuleId;
  readonly reason: string;
  /** The effective heir list already excludes this exact lineage group. */
  readonly partialLineageBlock: true;
}

export interface LineageHierarchyResolution {
  readonly normalizedHeirs: readonly HeirInput[];
  readonly blockedHeirs: readonly LineageBlockedHeir[];
  readonly requiredRuleIds: readonly LineageHierarchyRuleId[];
  readonly issues: readonly LineageIssueCode[];
  readonly unsupportedReasons: readonly string[];
}

const count = (heirs: readonly HeirInput[], type: HeirType): number =>
  heirs.filter((heir) => heir.type === type).reduce((total, heir) => total + heir.count, 0);

const requiredDescendantGeneration = (heir: HeirInput): number => {
  const generation = descendantGeneration(heir);
  if (generation === null) throw new Error("Expected a normalized son-line descendant.");
  return generation;
};

const requiredGrandmotherDegree = (heir: HeirInput): number => {
  const degree = grandmotherDegree(heir);
  if (degree === null) throw new Error("Expected a normalized grandmother lineage.");
  return degree;
};

const block = (
  blocked: LineageBlockedHeir[],
  blocker: HeirInput,
  blockee: HeirInput,
  ruleId: LineageHierarchyRuleId,
  reason: string,
): void => {
  blocked.push({
    blockedHeirId: blockee.heirId,
    type: blockee.type,
    count: blockee.count,
    blockerHeirId: blocker.heirId,
    blockerType: blocker.type,
    ruleId,
    reason,
    partialLineageBlock: true,
  });
};

function resolveDescendants(
  heirs: readonly HeirInput[],
): Pick<
  LineageHierarchyResolution,
  "normalizedHeirs" | "blockedHeirs" | "requiredRuleIds" | "unsupportedReasons"
> {
  const directSon = heirs.find((heir) => heir.type === "SON");
  const descendants = heirs.filter((heir) => descendantGeneration(heir) !== null);
  if (descendants.length === 0)
    return {
      normalizedHeirs: heirs,
      blockedHeirs: [],
      requiredRuleIds: [],
      unsupportedReasons: [],
    };
  const blocked: LineageBlockedHeir[] = [];
  const required = new Set<LineageHierarchyRuleId>();
  const blockedKeys = new Set<string>();
  if (directSon !== undefined) {
    for (const descendant of descendants) {
      blockedKeys.add(lineageKey(descendant));
      const generation = requiredDescendantGeneration(descendant);
      const ruleId =
        generation > 1
          ? LINEAGE_RULE_IDS.directSonBlocks
          : descendant.type === "SONS_SON"
            ? "KZ-FR-011-SON-BLOCKS-SONS-SON"
            : "KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER";
      block(
        blocked,
        directSon,
        descendant,
        ruleId,
        `The direct son blocks the ${lineageDescription(descendant)}.`,
      );
      required.add(ruleId);
    }
    return {
      normalizedHeirs: heirs.filter((heir) => !blockedKeys.has(lineageKey(heir))),
      blockedHeirs: blocked,
      requiredRuleIds: [...required],
      unsupportedReasons: [],
    };
  }

  const males = descendants.filter((heir) => heir.type === "SONS_SON");
  const females = descendants.filter((heir) => heir.type === "SONS_DAUGHTER");
  const nearestMaleGeneration = males.reduce<number | null>((nearest, heir) => {
    const generation = requiredDescendantGeneration(heir);
    return nearest === null || generation < nearest ? generation : nearest;
  }, null);
  if (nearestMaleGeneration !== null) {
    const nearestMale = males.find(
      (heir) => requiredDescendantGeneration(heir) === nearestMaleGeneration,
    );
    if (nearestMale === undefined) throw new Error("Nearest male descendant was not retained.");
    for (const descendant of descendants) {
      const generation = requiredDescendantGeneration(descendant);
      if (generation <= nearestMaleGeneration) continue;
      blockedKeys.add(lineageKey(descendant));
      block(
        blocked,
        nearestMale,
        descendant,
        LINEAGE_RULE_IDS.nearerMaleBlocks,
        `${lineageDescription(nearestMale)} is nearer and blocks ${lineageDescription(descendant)}.`,
      );
    }
    if (blockedKeys.size > 0) required.add(LINEAGE_RULE_IDS.nearerMaleBlocks);
  }

  const remainingFemales = females.filter((heir) => !blockedKeys.has(lineageKey(heir)));
  const directDaughters = count(heirs, "DAUGHTER");
  const lowerMaleRescue =
    nearestMaleGeneration !== null &&
    directDaughters >= 2 &&
    remainingFemales.some((heir) => requiredDescendantGeneration(heir) <= nearestMaleGeneration);
  if (
    !lowerMaleRescue &&
    (nearestMaleGeneration === null ||
      remainingFemales.every((heir) => requiredDescendantGeneration(heir) < nearestMaleGeneration))
  ) {
    const orderedGenerations = [
      ...new Set(remainingFemales.map(requiredDescendantGeneration)),
    ].sort((left, right) => left - right);
    const keep = new Set<number>();
    if (orderedGenerations.length > 0 && directDaughters < 2) {
      const firstGeneration = orderedGenerations[0];
      if (firstGeneration === undefined) throw new Error("Expected a first female generation.");
      keep.add(firstGeneration);
      const firstCount = remainingFemales
        .filter((heir) => descendantGeneration(heir) === orderedGenerations[0])
        .reduce((total, heir) => total + heir.count, 0);
      if (directDaughters === 0 && firstCount === 1 && orderedGenerations[1] !== undefined)
        keep.add(orderedGenerations[1]);
    }
    for (const female of remainingFemales) {
      const generation = requiredDescendantGeneration(female);
      if (keep.has(generation)) continue;
      const blocker =
        directDaughters >= 2
          ? heirs.find((heir) => heir.type === "DAUGHTER")
          : remainingFemales.find((heir) => keep.has(requiredDescendantGeneration(heir)));
      if (blocker === undefined) continue;
      blockedKeys.add(lineageKey(female));
      block(
        blocked,
        blocker,
        female,
        LINEAGE_RULE_IDS.nearerFemaleBlocks,
        `${lineageDescription(female)} is excluded after the nearer female-descendant entitlement reaches the source-defined ceiling.`,
      );
    }
    if (blocked.some(({ ruleId }) => ruleId === LINEAGE_RULE_IDS.nearerFemaleBlocks))
      required.add(LINEAGE_RULE_IDS.nearerFemaleBlocks);
  }

  const effective = heirs.filter((heir) => !blockedKeys.has(lineageKey(heir)));
  const effectiveFemaleGenerations = [
    ...new Set(
      effective.filter((heir) => heir.type === "SONS_DAUGHTER").map(requiredDescendantGeneration),
    ),
  ];
  const hasMale = effective.some((heir) => heir.type === "SONS_SON");
  const multipleFemaleFixedLevels =
    effectiveFemaleGenerations.length > 1 && !(hasMale && directDaughters >= 2);
  return {
    normalizedHeirs: effective,
    blockedHeirs: blocked,
    requiredRuleIds: [...required],
    unsupportedReasons: multipleFemaleFixedLevels
      ? ["DESCENDANT_MULTILEVEL_FEMALE_FIXED_SHARES_NOT_ADMITTED"]
      : [],
  };
}

function resolveGrandmothers(
  heirs: readonly HeirInput[],
): Pick<
  LineageHierarchyResolution,
  "normalizedHeirs" | "blockedHeirs" | "requiredRuleIds" | "unsupportedReasons"
> {
  const grandmothers = heirs.filter((heir) => grandmotherDegree(heir) !== null);
  if (grandmothers.length === 0)
    return {
      normalizedHeirs: heirs,
      blockedHeirs: [],
      requiredRuleIds: [],
      unsupportedReasons: [],
    };
  const blocked: LineageBlockedHeir[] = [];
  const required = new Set<LineageHierarchyRuleId>();
  const blockedKeys = new Set<string>();
  const mother = heirs.find((heir) => heir.type === "MOTHER");
  if (mother !== undefined) {
    for (const grandmother of grandmothers) {
      const ruleId =
        requiredGrandmotherDegree(grandmother) === 2
          ? "KZ-FR-017-MOTHER-BLOCKS-GRANDMOTHER-GROUP"
          : LINEAGE_RULE_IDS.motherBlocksGrandmothers;
      blockedKeys.add(lineageKey(grandmother));
      block(
        blocked,
        mother,
        grandmother,
        ruleId,
        `The mother blocks ${lineageDescription(grandmother)}.`,
      );
      required.add(ruleId);
    }
  }

  const father = heirs.find((heir) => heir.type === "FATHER");
  const grandfather = heirs.find((heir) => heir.type === "PATERNAL_GRANDFATHER");
  for (const [ascendant, ownMotherPath] of [
    [father, "FATHER>MOTHER"],
    [grandfather, "FATHER>FATHER>MOTHER"],
  ] as const) {
    if (ascendant === undefined) continue;
    for (const grandmother of grandmothers) {
      if (grandmother.lineage?.path.join(">") !== ownMotherPath) continue;
      blockedKeys.add(lineageKey(grandmother));
      const ruleId =
        ascendant.type === "FATHER" && grandmotherDegree(grandmother) === 2
          ? "KZ-FR-017-FATHER-BLOCKS-PATERNAL-GRANDMOTHER"
          : LINEAGE_RULE_IDS.maleAscendantBlocksOwnMother;
      block(
        blocked,
        ascendant,
        grandmother,
        ruleId,
        `${ascendant.type} blocks his own mother in the represented lineage.`,
      );
      required.add(ruleId);
    }
  }

  const available = grandmothers.filter((heir) => !blockedKeys.has(lineageKey(heir)));
  for (const type of ["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"] as const) {
    const side = available.filter((heir) => heir.type === type);
    const nearest = side.reduce<number | null>((degree, heir) => {
      const current = requiredGrandmotherDegree(heir);
      return degree === null || current < degree ? current : degree;
    }, null);
    if (nearest === null) continue;
    const blocker = side.find((heir) => requiredGrandmotherDegree(heir) === nearest);
    if (blocker === undefined) throw new Error("Nearest grandmother was not retained.");
    for (const grandmother of side) {
      if (grandmotherDegree(grandmother) === nearest) continue;
      blockedKeys.add(lineageKey(grandmother));
      block(
        blocked,
        blocker,
        grandmother,
        LINEAGE_RULE_IDS.nearerGrandmotherBlocks,
        `${lineageDescription(blocker)} is nearer on the same side and blocks ${lineageDescription(grandmother)}.`,
      );
      required.add(LINEAGE_RULE_IDS.nearerGrandmotherBlocks);
    }
  }

  const afterSameSide = grandmothers.filter((heir) => !blockedKeys.has(lineageKey(heir)));
  const nearestMaternal = afterSameSide.find((heir) => heir.type === "MATERNAL_GRANDMOTHER");
  if (nearestMaternal !== undefined) {
    for (const paternal of afterSameSide.filter((heir) => heir.type === "PATERNAL_GRANDMOTHER")) {
      if (requiredGrandmotherDegree(nearestMaternal) >= requiredGrandmotherDegree(paternal))
        continue;
      blockedKeys.add(lineageKey(paternal));
      block(
        blocked,
        nearestMaternal,
        paternal,
        LINEAGE_RULE_IDS.maternalGrandmotherPriority,
        `${lineageDescription(nearestMaternal)} is nearer from the maternal side and blocks ${lineageDescription(paternal)}.`,
      );
      required.add(LINEAGE_RULE_IDS.maternalGrandmotherPriority);
    }
  }
  return {
    normalizedHeirs: heirs.filter((heir) => !blockedKeys.has(lineageKey(heir))),
    blockedHeirs: blocked,
    requiredRuleIds: [...required],
    unsupportedReasons: [],
  };
}

export function resolveLineageHierarchy(input: readonly HeirInput[]): LineageHierarchyResolution {
  const normalized = normalizeLineageAwareHeirs(input);
  if (normalized.issues.length > 0)
    return {
      normalizedHeirs: [],
      blockedHeirs: [],
      requiredRuleIds: [],
      issues: normalized.issues.map(({ code }) => code),
      unsupportedReasons: [],
    };
  const descendants = resolveDescendants(normalized.heirs);
  const grandmothers = resolveGrandmothers(descendants.normalizedHeirs);
  return {
    normalizedHeirs: grandmothers.normalizedHeirs,
    blockedHeirs: [...descendants.blockedHeirs, ...grandmothers.blockedHeirs],
    requiredRuleIds: [
      ...new Set([...descendants.requiredRuleIds, ...grandmothers.requiredRuleIds]),
    ],
    issues: [],
    unsupportedReasons: [...descendants.unsupportedReasons, ...grandmothers.unsupportedReasons],
  };
}
