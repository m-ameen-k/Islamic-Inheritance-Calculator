export type EstateObligationType =
  "FUNERAL_EXPENSE" | "DEBT" | "UNPAID_RELIGIOUS_OBLIGATION" | "OTHER";

export interface EstateObligation {
  readonly obligationId: string;
  readonly type: EstateObligationType;
  readonly amountMinorUnits: string;
  readonly description: string;
}

export interface WasiyyahInput {
  readonly amountMinorUnits: string;
  readonly description: string;
  readonly beneficiaryReferences: readonly string[];
}

export interface EstateInput {
  readonly currencyCode: string;
  readonly grossEstateMinorUnits: string;
  readonly obligations: readonly EstateObligation[];
  readonly wasiyyah: WasiyyahInput | null;
}
