import { describe, expect, it } from "vitest";
import type { Contact, ContactPreferences } from "@mms/shared";
import {
  formatContactPhoneDisplay,
  formatContactPhoneFull,
  formatTelHref,
  getFallbackCountryCode,
  resolveContactPhoneDisplay,
} from "@/lib/contacts/contactPhoneDisplay";

describe("formatContactPhoneDisplay", () => {
  it("returns the fallback code and empty number for empty input", () => {
    expect(formatContactPhoneDisplay("", "+92")).toEqual({
      countryCode: "+92",
      formattedNumber: "",
    });
    expect(formatContactPhoneDisplay(null, "+92")).toEqual({
      countryCode: "+92",
      formattedNumber: "",
    });
  });

  it("parses an international number into country code and local part", () => {
    expect(formatContactPhoneDisplay("+1 555 1234", "+92")).toEqual({
      countryCode: "+1",
      formattedNumber: "555 1234",
    });
  });

  it("formats a local number with the fallback country code", () => {
    expect(formatContactPhoneDisplay("3001234567", "+92")).toEqual({
      countryCode: "+92",
      formattedNumber: "3001234567",
    });
  });
});

describe("formatTelHref", () => {
  it("returns '#' for empty input", () => {
    expect(formatTelHref(null)).toBe("#");
    expect(formatTelHref("")).toBe("#");
  });

  it("builds a digit-only tel: href for a +92 number", () => {
    expect(formatTelHref("+92 300 1234567")).toBe("tel:+923001234567");
    expect(formatTelHref("+923001234567")).toBe("tel:+923001234567");
  });
});

describe("formatContactPhoneFull", () => {
  it("formats a local number with the fallback country code", () => {
    expect(formatContactPhoneFull("3001234567", "+92")).toBe("+92 3001234567");
  });

  it("keeps an international number whole", () => {
    expect(formatContactPhoneFull("+1 555 1234")).toBe("+1 555 1234");
  });

  it("falls back to the raw string when input is empty", () => {
    expect(formatContactPhoneFull("", "+92")).toBe("");
    expect(formatContactPhoneFull(null, "+92")).toBe("");
  });
});

describe("getFallbackCountryCode", () => {
  const codesMap: Record<string, string> = { PK: "+92", SA: "+966" };

  it("prefers the mapped default country from prefs", () => {
    expect(getFallbackCountryCode({ defaultCountry: "PK" }, codesMap)).toBe("+92");
  });

  it("falls back to the first configured country code", () => {
    expect(getFallbackCountryCode({}, undefined, [{ country: "Pakistan", code: "+92" }])).toBe(
      "+92",
    );
  });

  it("falls back to the first mapped code when no configured list exists", () => {
    expect(getFallbackCountryCode({}, codesMap)).toBe("+92");
  });

  it("returns empty string when nothing is resolvable", () => {
    expect(getFallbackCountryCode({})).toBe("");
    expect(getFallbackCountryCode({ defaultCountry: "XX" }, {})).toBe("");
  });
});

describe("resolveContactPhoneDisplay", () => {
  it("resolves the primary phone and display via shared formatting", () => {
    const contact: Contact = {
      id: "c1",
      name: "Aisha",
      firstName: "Aisha",
      phones: [
        { label: "Mobile", number: "+923001234567", countryCode: "+92", isPrimary: true },
        { label: "Work", number: "5551234", countryCode: "+1" },
      ],
    };
    expect(resolveContactPhoneDisplay(contact)).toEqual({
      phone: "+92 3001234567",
      countryCode: "+92",
      phoneDisplay: "3001234567",
    });
  });

  it("returns empty display with the fallback country code for an empty contact", () => {
    const contact: Contact = { id: "c2", name: "New", firstName: "New" };
    const prefs: Partial<ContactPreferences> = { defaultCountry: "PK" };
    expect(resolveContactPhoneDisplay(contact, prefs, { PK: "+92" })).toEqual({
      phone: null,
      countryCode: "+92",
      phoneDisplay: "",
    });
  });
});
