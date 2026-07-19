import { describe, it, expect } from "vitest";
import { translateAppParams, registerLanguagePack } from "./appTranslations.js";

describe("Translation System Enhancements", () => {
  it("translates simple placeholders", () => {
    // Register temporary key in en/test for checking
    registerLanguagePack("en", {
      "test.simple": "Hello {name}, welcome to {place}!"
    } as any);

    const result = translateAppParams(
      "test.simple" as any,
      "en",
      { name: "Aalin", place: "MMS" }
    );
    expect(result).toBe("Hello Aalin, welcome to MMS!");
  });

  it("formats ICU select plural forms correctly", () => {
    registerLanguagePack("en", {
      "test.icu": "You have {count} {count, select, one {item} other {items}} pending."
    } as any);

    // Singular count === 1
    const singularResult = translateAppParams(
      "test.icu" as any,
      "en",
      { count: 1 }
    );
    expect(singularResult).toBe("You have 1 item pending.");

    // Plural count === 0
    const pluralZeroResult = translateAppParams(
      "test.icu" as any,
      "en",
      { count: 0 }
    );
    expect(pluralZeroResult).toBe("You have 0 items pending.");

    // Plural count === 5
    const pluralResult = translateAppParams(
      "test.icu" as any,
      "en",
      { count: 5 }
    );
    expect(pluralResult).toBe("You have 5 items pending.");
  });

  it("cascades Farsi translations to Arabic first, then English", () => {
    registerLanguagePack("en", {
      "test.cascade": "English Value",
      "test.only_in_ar": "Arabic En",
      "test.only_in_fa": "Farsi Only"
    } as any);

    registerLanguagePack("ar", {
      "test.cascade": "Arabic Value",
      "test.only_in_ar": "Arabic Value"
    } as any);

    registerLanguagePack("fa", {
      "test.cascade": "Farsi Value",
      "test.only_in_fa": "Farsi Value"
    } as any);

    // exact match
    expect(translateAppParams("test.cascade" as any, "fa")).toBe("Farsi Value");
    // fallback to Arabic
    expect(translateAppParams("test.only_in_ar" as any, "fa")).toBe("Arabic Value");
  });

  it("formats numbers automatically based on locale but preserves IDs/Codes", () => {
    registerLanguagePack("en", {
      "test.number": "Total count is {count}, ID is {studentId}, code is {someCode}."
    } as any);

    const result = translateAppParams(
      "test.number" as any,
      "en",
      { count: 1250, studentId: 9876, someCode: 1122 }
    );
    expect(result).toBe("Total count is 1,250, ID is 9876, code is 1122.");
  });
});

