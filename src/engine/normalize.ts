import type { EstateInput, EstateObligation, WasiyyahInput } from "../domain/estate";
import type { HeirInput } from "../domain/heirs";
import type { InheritanceCase } from "../domain/inheritance-case";

function normalizeIdentifier(value: string): string {
  return value.trim();
}

function normalizeMinorUnits(value: string): string {
  const trimmed = value.trim();
  if (!/^\+?\d+$/.test(trimmed)) {
    return trimmed;
  }

  return BigInt(trimmed).toString();
}

function normalizeObligation(obligation: EstateObligation): EstateObligation {
  return {
    obligationId: normalizeIdentifier(obligation.obligationId),
    type: obligation.type,
    amountMinorUnits: normalizeMinorUnits(obligation.amountMinorUnits),
    description: obligation.description.trim(),
  };
}

function normalizeWasiyyah(wasiyyah: WasiyyahInput | null): WasiyyahInput | null {
  if (wasiyyah === null) {
    return null;
  }

  return {
    amountMinorUnits: normalizeMinorUnits(wasiyyah.amountMinorUnits),
    description: wasiyyah.description.trim(),
    beneficiaryReferences: wasiyyah.beneficiaryReferences.map(normalizeIdentifier),
  };
}

function normalizeEstate(estate: EstateInput): EstateInput {
  return {
    currencyCode: estate.currencyCode.trim().toUpperCase(),
    grossEstateMinorUnits: normalizeMinorUnits(estate.grossEstateMinorUnits),
    obligations: estate.obligations.map(normalizeObligation),
    wasiyyah: normalizeWasiyyah(estate.wasiyyah),
  };
}

function normalizeHeir(heir: HeirInput): HeirInput {
  return {
    heirId: normalizeIdentifier(heir.heirId),
    type: heir.type,
    count: heir.count,
  };
}

/**
 * Returns a normalized deep copy and never changes the supplied case object.
 */
export function normalizeCase(input: InheritanceCase): InheritanceCase {
  return {
    caseId: normalizeIdentifier(input.caseId),
    madhhab: input.madhhab,
    mode: input.mode,
    deceasedSex: input.deceasedSex,
    estate: normalizeEstate(input.estate),
    heirs: input.heirs.map(normalizeHeir),
  };
}

export function snapshotCase(input: InheritanceCase): InheritanceCase {
  return {
    caseId: input.caseId,
    madhhab: input.madhhab,
    mode: input.mode,
    deceasedSex: input.deceasedSex,
    estate: {
      currencyCode: input.estate.currencyCode,
      grossEstateMinorUnits: input.estate.grossEstateMinorUnits,
      obligations: input.estate.obligations.map((obligation) => ({
        obligationId: obligation.obligationId,
        type: obligation.type,
        amountMinorUnits: obligation.amountMinorUnits,
        description: obligation.description,
      })),
      wasiyyah:
        input.estate.wasiyyah === null
          ? null
          : {
              amountMinorUnits: input.estate.wasiyyah.amountMinorUnits,
              description: input.estate.wasiyyah.description,
              beneficiaryReferences: [...input.estate.wasiyyah.beneficiaryReferences],
            },
    },
    heirs: input.heirs.map((heir) => ({ ...heir })),
  };
}
