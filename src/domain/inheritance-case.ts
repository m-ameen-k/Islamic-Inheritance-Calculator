import type { EstateInput } from "./estate";
import type { HeirInput, PersonSex } from "./heirs";

export type Madhhab = "SHAFII";

export type CalculationMode = "VERIFIED" | "RESEARCH";

export interface InheritanceCase {
  readonly caseId: string;
  readonly madhhab: Madhhab;
  readonly mode: CalculationMode;
  readonly deceasedSex: PersonSex;
  readonly estate: EstateInput;
  readonly heirs: readonly HeirInput[];
}
