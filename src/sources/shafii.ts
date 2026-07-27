import {
  BibliographicSourceCatalog,
  type BibliographicSourceRecord,
} from "../domain/source-catalog";

export const KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3 = {
  sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
  title: "كنز الراغبين شرح منهاج الطالبين",
  author: "الإمام جلال الدين محمد بن أحمد المحلي",
  authorDates: "791–864 AH",
  preparedOrEditedBy: "محمود صالح أحمد حسن الحديدي",
  publisher: "دار المنهاج للنشر والتوزيع",
  publicationPlace: "Jeddah, Saudi Arabia",
  edition: "Second edition",
  publicationDateAh: "1434 AH",
  publicationDateCe: "2013 CE",
  isbn: "978-9953-541-31-0",
  physicalVolume: "المجلد الثاني",
  internalPart: "الجزء الثالث",
  relevantChapter: "كتاب الفرائض",
  printedPageMap: [
    { sectionTitle: "كتاب الفرائض", printedPage: "133" },
    {
      sectionTitle: "بيان الفروض التي في القرآن الكريم وذويها",
      printedPage: "136",
    },
    { sectionTitle: "ذوو الأرحام عند فقد أصحاب الفروض", printedPage: "136" },
    { sectionTitle: "الحجب", printedPage: "138" },
    { sectionTitle: "إرث الأولاد وأولادهم", printedPage: "140" },
    { sectionTitle: "كيفية إرث الأصول", printedPage: "141" },
    { sectionTitle: "إرث الحواشي", printedPage: "143" },
    { sectionTitle: "الإرث بالولاء", printedPage: "145" },
    { sectionTitle: "حكم الجد مع الإخوة", printedPage: "146" },
    { sectionTitle: "موانع الإرث", printedPage: "148" },
    { sectionTitle: "أصول المسائل وما يعول منها", printedPage: "152" },
    { sectionTitle: "تصحيح المسائل", printedPage: "154" },
    { sectionTitle: "المناسخات", printedPage: "157" },
    { sectionTitle: "كتاب الوصايا", printedPage: "159" },
  ],
} as const satisfies BibliographicSourceRecord;

/**
 * Bibliographic metadata only. The private PDF is not stored or referenced as
 * a repository file, and this catalog contains no executable fiqh rules.
 */
export const SHAFII_BIBLIOGRAPHIC_SOURCES: readonly BibliographicSourceRecord[] = Object.freeze([
  KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3,
]);

export function createShafiiSourceCatalog(): BibliographicSourceCatalog {
  return new BibliographicSourceCatalog(SHAFII_BIBLIOGRAPHIC_SOURCES);
}
