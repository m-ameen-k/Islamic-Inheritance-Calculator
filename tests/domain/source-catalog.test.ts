import { describe, expect, it } from "vitest";

import {
  BibliographicSourceCatalog,
  MalformedBibliographicSourceError,
  validateBibliographicSource,
} from "../../src/domain/source-catalog";
import { PROVISIONAL_SHAFII_RULES } from "../../src/madhahib/shafii/provisional-rules";
import { VERIFIED_SHAFII_RULES } from "../../src/madhahib/shafii/verified-rules";
import {
  KHULASAT_AL_FIQH_AL_ISLAMI,
  KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3,
  createShafiiSourceCatalog,
} from "../../src/sources/shafii";
import { makeTestOnlyRule } from "../helpers/test-only-rule";

describe("TECHNICAL_TEST: bibliographic source catalog", () => {
  it("looks up the confirmed source by source ID", () => {
    const catalog = createShafiiSourceCatalog();
    const source = catalog.getById("KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3");

    expect(source).toBe(KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3);
    expect(source?.physicalVolume).toBe("المجلد الثاني");
    expect(source?.internalPart).toBe("الجزء الثالث");
    expect(source?.printedPageMap).toContainEqual({
      sectionTitle: "كتاب الفرائض",
      printedPage: "133",
    });
  });

  it("registers Khulasat al-Fiqh as a Shafii corroborating instructional source", () => {
    const catalog = createShafiiSourceCatalog();
    const source = catalog.getById("KHULASAT_AL_FIQH_AL_ISLAMI");

    expect(source).toBe(KHULASAT_AL_FIQH_AL_ISLAMI);
    expect(source).toMatchObject({
      title: "خلاصة الفقه الإسلامي على مذهب الإمام الشافعي رحمه الله",
      author: "الشيخ عبد الرحمن بن محمد المليباري",
      publisher: "جامعة الهند الإسلامية، كاليكوت",
      edition: "الطبعة الخامسة والعشرون",
      publicationDateCe: "July 2019",
      madhhab: "SHAFII",
      metadataCompleteness: "PARTIAL",
      sourceRole:
        "Trusted corroborating instructional source for conditions, tables, worked examples and source-derived fixtures.",
    });
    expect(source?.printedPageMap).toEqual([]);
  });

  it("retains Kanz/al-Mahalli as the primary detailed computational source", () => {
    expect(KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3.sourceRole).toBe(
      "Primary detailed Shafi‘i computational source.",
    );
    expect(KHULASAT_AL_FIQH_AL_ISLAMI.sourceRole).toMatch(/^Trusted corroborating/);
    expect(KHULASAT_AL_FIQH_AL_ISLAMI.sourceRole).not.toMatch(/primary/i);
  });

  it("rejects duplicate source IDs", () => {
    expect(
      () =>
        new BibliographicSourceCatalog([
          KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3,
          KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3,
        ]),
    ).toThrow("Duplicate source ID");
  });

  it("rejects missing required bibliography fields", () => {
    const malformed = {
      ...KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3,
      publisher: "",
      printedPageMap: [],
    };

    expect(validateBibliographicSource(malformed)).toEqual(
      expect.arrayContaining([
        {
          path: "publisher",
          message: "publisher must be a non-empty string.",
        },
        {
          path: "printedPageMap",
          message: "A complete source must contain at least one printed-page entry.",
        },
      ]),
    );
    expect(() => new BibliographicSourceCatalog([malformed])).toThrow(
      MalformedBibliographicSourceError,
    );
  });

  it("keeps bibliography records separate from executable rules", () => {
    const source = KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3;
    const testOnlyRule = makeTestOnlyRule("TEST_ONLY_SOURCE_REFERENCE");

    expect(source).not.toHaveProperty("status");
    expect(source).not.toHaveProperty("conditions");
    expect(source).not.toHaveProperty("exclusions");
    expect(source).not.toHaveProperty("result");
    expect(source).not.toHaveProperty("exactArabicQuotation");
    expect(testOnlyRule.sourceId).toBe("TEST_ONLY_SOURCE");
    expect(VERIFIED_SHAFII_RULES).toEqual([]);
    expect(PROVISIONAL_SHAFII_RULES).toEqual([]);
  });
});
