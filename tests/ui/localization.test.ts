import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DATA_SOURCE = readFileSync(join(PROJECT_ROOT, "js/data.js"), "utf8");
const APP_SOURCE = readFileSync(join(PROJECT_ROOT, "js/app.js"), "utf8");
const HTML_SOURCE = readFileSync(join(PROJECT_ROOT, "index.html"), "utf8");
const CSS_SOURCE = readFileSync(join(PROJECT_ROOT, "css/style.css"), "utf8");

interface ResolvedText {
  readonly text: string;
  readonly requestedLanguage: string;
  readonly resolvedLanguage: string;
  readonly direction: "ltr" | "rtl";
  readonly fallbackUsed: boolean;
  readonly missingKey: string | null;
}

interface BilingualText {
  readonly primaryLanguage: string;
  readonly secondaryLanguage: string;
  readonly primaryDirection: "ltr" | "rtl";
  readonly secondaryDirection: "ltr" | "rtl";
  readonly primary: ResolvedText;
  readonly secondary: ResolvedText;
}

interface LocalizationApi {
  readonly getLanguagePair: (language: string) => Omit<BilingualText, "primary" | "secondary">;
  readonly getBilingualText: (key: string, language: string) => BilingualText;
  readonly getPrimaryText: (key: string, language: string) => ResolvedText;
  readonly loadMainLanguage: (storage: StorageLike) => string;
  readonly saveMainLanguage: (storage: StorageLike, language: string) => void;
  readonly storageKey: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function loadLocalizationApi(): LocalizationApi {
  return runInNewContext(
    `${DATA_SOURCE}\n({ getLanguagePair, getBilingualText, getPrimaryText, loadMainLanguage, saveMainLanguage, storageKey: MAIN_LANGUAGE_STORAGE_KEY })`,
    {},
  ) as LocalizationApi;
}

function memoryStorage(initial: Readonly<Record<string, string>> = {}) {
  const values = new Map(Object.entries(initial));
  const writes: Array<readonly [string, string]> = [];
  return {
    values,
    writes,
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      writes.push([key, value]);
      values.set(key, value);
    },
  };
}

describe("TECHNICAL_TEST: deterministic bilingual UI localization", () => {
  const localization = loadLocalizationApi();

  it.each([
    ["en", "en", "ar", "ltr", "rtl"],
    ["ar", "ar", "en", "rtl", "ltr"],
    ["ml", "ml", "ar", "ltr", "rtl"],
  ] as const)(
    "maps main %s to primary %s and secondary %s with independent directions",
    (main, primary, secondary, primaryDirection, secondaryDirection) => {
      expect(localization.getLanguagePair(main)).toEqual({
        primaryLanguage: primary,
        secondaryLanguage: secondary,
        primaryDirection,
        secondaryDirection,
      });
      expect(primary).not.toBe(secondary);
    },
  );

  it("renders the canonical estate heading in the required three pairings", () => {
    const english = localization.getBilingualText("est_t", "en");
    const arabic = localization.getBilingualText("est_t", "ar");
    const malayalam = localization.getBilingualText("est_t", "ml");

    expect([english.primary.text, english.secondary.text]).toEqual([
      "Estate & Liabilities",
      "التركة والخصوم",
    ]);
    expect([arabic.primary.text, arabic.secondary.text]).toEqual([
      "التركة والخصوم",
      "Estate & Liabilities",
    ]);
    expect([malayalam.primary.text, malayalam.secondary.text]).toEqual([
      "സ്വത്തും ബാധ്യതകളും",
      "التركة والخصوم",
    ]);
  });

  it("never duplicates Arabic in Arabic mode and never selects English normally for Malayalam", () => {
    const arabic = localization.getBilingualText("est_t", "ar");
    const malayalam = localization.getBilingualText("est_t", "ml");

    expect(arabic.primary.resolvedLanguage).toBe("ar");
    expect(arabic.secondary.resolvedLanguage).toBe("en");
    expect(arabic.primary.text).not.toBe(arabic.secondary.text);
    expect(malayalam.secondary.requestedLanguage).toBe("ar");
    expect(malayalam.secondary.resolvedLanguage).toBe("ar");
  });

  it("uses the selected language only for ordinary UI text", () => {
    expect(localization.getPrimaryText("cash", "en").text).toBe("Cash");
    expect(localization.getPrimaryText("cash", "ar").text).toBe("نقد");
    expect(localization.getPrimaryText("cash", "ml").text).toBe("പണം");
  });

  it("persists only the selected main language and always derives the secondary language", () => {
    const storage = memoryStorage();

    localization.saveMainLanguage(storage, "ml");

    expect(localization.storageKey).toBe("faraid-language");
    expect(storage.writes).toEqual([["faraid-language", "ml"]]);
    expect(localization.loadMainLanguage(storage)).toBe("ml");
    expect(
      localization.getLanguagePair(localization.loadMainLanguage(storage)).secondaryLanguage,
    ).toBe("ar");
    expect([...storage.values.keys()]).toEqual(["faraid-language"]);
  });

  it("keeps bilingual rendering limited to explicitly marked structural headings", () => {
    const bilingualKeys = [...HTML_SOURCE.matchAll(/data-bilingual="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(bilingualKeys).toEqual([
      "s_dec",
      "s_est",
      "s_mad",
      "s_heir",
      "s_res",
      "group_spouse",
      "group_descendants",
      "group_parents",
      "group_siblings",
      "group_extended",
    ]);
    expect(HTML_SOURCE).not.toMatch(
      /data-bilingual="(?:gross_estate|calc_disabled|payment_soon|support_project)"/,
    );
    expect(APP_SOURCE).not.toContain("getBilingualHeirText");
  });

  it("applies document and per-line language metadata through the centralized renderer", () => {
    expect(APP_SOURCE).toContain("const pair=getLanguagePair(lang)");
    expect(APP_SOURCE).toContain("document.documentElement.lang=pair.primaryLanguage");
    expect(APP_SOURCE).toContain("document.documentElement.dir=pair.primaryDirection");
    expect(APP_SOURCE).toContain('element.setAttribute("lang",resolved.resolvedLanguage)');
    expect(APP_SOURCE).toContain('element.setAttribute("dir",resolved.direction)');
    expect(APP_SOURCE).toContain('el.setAttribute("aria-hidden","true")');
    expect(APP_SOURCE).not.toContain('if(lang === "ar") return h.ml');
  });

  it("keeps numeric and code-like values LTR independently of document direction", () => {
    expect(HTML_SOURCE).toMatch(/type="number"/);
    expect(HTML_SOURCE).toMatch(/class="[^"]*code-like/);
    expect(CSS_SOURCE).toMatch(/input\[type="number"\][\s\S]*direction: ltr !important/);
    expect(APP_SOURCE).toContain('input[type="number"],.numeric-value,.code-like');
  });

  it("keeps the calculation action disabled while localizing its visible status", () => {
    expect(HTML_SOURCE).toMatch(/<button[^>]*id="calcBtn"[^>]*\bdisabled\b/);
    expect(HTML_SOURCE).toContain('data-i="calc_disabled"');
    expect(HTML_SOURCE).toContain('data-i="calc_disabled_reason"');
  });

  it("preserves the permanent brand lockup without localization markers", () => {
    expect(HTML_SOURCE).toContain(
      '<div class="logo-main">علم الفرائض <span>Islamic Inheritance Calculator</span></div>',
    );
    expect(HTML_SOURCE).not.toContain('class="logo-ar"');
    expect(HTML_SOURCE).not.toMatch(/class="logo-main"[^>]*data-i/);
  });
});
