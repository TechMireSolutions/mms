import { describe, expect, it } from "vitest";
import { parsePhoneNumber, normalizeToE164, mergeContacts, applyTitleCaseRecursive, formatMoney, formatNumber, formatDateToIso } from "./utils.js";
import type { Contact } from "./contactTypes.js";


describe("parsePhoneNumber", () => {
  it("parses E.164 with space separator", () => {
    expect(parsePhoneNumber("+92 300 1234567")).toEqual({
      countryCode: "+92",
      number: "300 1234567",
    });
  });

  it("returns default code for bare local number", () => {
    expect(parsePhoneNumber("03001234567", "+92")).toEqual({
      countryCode: "+92",
      number: "03001234567",
    });
  });

  it("handles empty input", () => {
    expect(parsePhoneNumber("", "+1")).toEqual({ countryCode: "+1", number: "" });
  });

  it("handles 00 prefix", () => {
    expect(parsePhoneNumber("00923001234567", "+92")).toEqual({
      countryCode: "+92",
      number: "3001234567",
    });
  });

  it("parses non-spaced number correctly with knownCodes", () => {
    expect(parsePhoneNumber("+923001234567", "+92", ["+92"])).toEqual({
      countryCode: "+92",
      number: "3001234567",
    });
  });

  it("falls back to greedy parsing when knownCodes is empty", () => {
    expect(parsePhoneNumber("+923001234567", "+92", [])).toEqual({
      countryCode: "+92", // Matches "+92" because it's listed in internal common codes (+92)
      number: "3001234567",
    });
    expect(parsePhoneNumber("+9993001234567", "+92", [])).toEqual({
      countryCode: "+9993", // Greedily matches 4 digits because +9993 is not in common list
      number: "001234567",
    });
  });
});

describe("normalizeToE164", () => {
  it("combines country code and local number", () => {
    expect(normalizeToE164("+92", "300-1234567")).toBe("+923001234567");
  });

  it("strips leading zero from local part", () => {
    expect(normalizeToE164("+92", "03001234567")).toBe("+923001234567");
  });
});

describe("mergeContacts", () => {
  const base: Contact = {
    id: "1",
    firstName: "Ali",
    lastName: "Khan",
    name: "Ali Khan",
    phones: [{ label: "Mobile", number: "3001111111", countryCode: "+92" }],
  };

  const other: Contact = {
    id: "2",
    firstName: "Ali",
    lastName: "Khan",
    name: "Ali Khan",
    emails: [{ label: "Personal", address: "ali@example.com" }],
  };

  it("merges collection fields", () => {
    const merged = mergeContacts(base, other);
    expect(merged.emails).toHaveLength(1);
    expect(merged.phones).toHaveLength(1);
  });
});

describe("applyTitleCaseRecursive", () => {
  it("converts simple string fields to Title Case", () => {
    expect(applyTitleCaseRecursive("john doe")).toBe("John Doe");
    expect(applyTitleCaseRecursive("alice smith-jones")).toBe("Alice Smith-jones");
  });

  it("recursively processes objects and arrays", () => {
    const input = {
      name: "john doe",
      description: "some long description",
      tags: ["first tag", "second tag"],
      nested: {
        note: "this is nested note",
      },
    };
    const expected = {
      name: "John Doe",
      description: "Some Long Description",
      tags: ["First Tag", "Second Tag"],
      nested: {
        note: "This Is Nested Note",
      },
    };
    expect(applyTitleCaseRecursive(input)).toEqual(expected);
  });

  it("ignores technical and system keys", () => {
    const input = {
      id: "some_id",
      userId: "user_123",
      email: "user@domain.com",
      status: "pending_verification",
      role: "assistant_teacher",
      _privateField: "dont touch me",
      name: "should be changed",
    };
    const expected = {
      id: "some_id",
      userId: "user_123",
      email: "user@domain.com",
      status: "pending_verification",
      role: "assistant_teacher",
      _privateField: "dont touch me",
      name: "Should Be Changed",
    };
    expect(applyTitleCaseRecursive(input)).toEqual(expected);
  });

  it("ignores non-eligible strings like URLs, phone numbers, and dates", () => {
    const input = {
      website: "https://example.com/some-page",
      birthday: "2026-07-03",
      phone: "+92 300 1234567",
      phoneNumber: "03001234567",
      address: "123 main street",
    };
    const expected = {
      website: "https://example.com/some-page",
      birthday: "2026-07-03",
      phone: "+92 300 1234567",
      phoneNumber: "03001234567",
      address: "123 Main Street",
    };
    expect(applyTitleCaseRecursive(input)).toEqual(expected);
  });
});

describe("formatMoney", () => {
  it("formats standard number with default PKR", () => {
    expect(formatMoney(1500)).toBe("PKR 1,500");
    expect(formatMoney(0)).toBe("PKR 0");
  });

  it("handles string numbers and decimal limits", () => {
    expect(formatMoney("25000")).toBe("PKR 25,000");
    expect(formatMoney(1234.567)).toBe("PKR 1,234.57");
  });

  it("handles custom currencies", () => {
    expect(formatMoney(100, "USD")).toBe("USD 100");
    expect(formatMoney(50.5, "₨")).toBe("₨ 50.5");
  });

  it("gracefully falls back for invalid/missing values", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney(undefined)).toBe("—");
    expect(formatMoney("invalid")).toBe("—");
  });

  it("supports formatting with symbols, decimal override, and currency code exclusion", () => {
    // Symbol prefixing
    expect(formatMoney(1500, "USD", { useSymbol: true })).toBe("$ 1,500");
    expect(formatMoney(1500, "PKR", { useSymbol: true })).toBe("₨ 1,500");

    // Decimal overriding
    expect(formatMoney(1234.56, "PKR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })).toBe("PKR 1,234.560");
    expect(formatMoney(1234.5, "USD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe("USD 1,235");

    // Exclude currency prefix
    expect(formatMoney(1234.56, "PKR", { excludeCurrency: true })).toBe("1,234.56");
    expect(formatMoney(1234.56, "PKR", { excludeCurrency: true, minimumFractionDigits: 4, maximumFractionDigits: 4 })).toBe("1,234.5600");
  });

  it("resolves fallback currency from window.localStorage if available", () => {
    const originalWindow = (globalThis as any).window;
    const originalLocalStorage = (globalThis as any).localStorage;

    try {
      const mockStorage: Record<string, string> = {
        "tenant1:finance_settings": JSON.stringify({ currency: "GBP" }),
      };

      (globalThis as any).window = {};
      (globalThis as any).localStorage = {
        length: 1,
        key: (index: number) => "tenant1:finance_settings",
        getItem: (key: string) => mockStorage[key] || null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      };

      expect(formatMoney(100)).toBe("GBP 100");
    } finally {
      (globalThis as any).window = originalWindow;
      (globalThis as any).localStorage = originalLocalStorage;
    }
  });
});

describe("formatNumber", () => {
  it("formats standard numbers and numeric strings", () => {
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber("56789")).toBe("56,789");
    expect(formatNumber(0)).toBe("0");
  });

  it("handles null, undefined, and NaN gracefully", () => {
    expect(formatNumber(null)).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
    expect(formatNumber("invalid")).toBe("0");
  });

  it("respects custom Intl options", () => {
    expect(formatNumber(12.3456, { maximumFractionDigits: 2 })).toBe("12.35");
  });
});

describe("formatDateToIso", () => {
  it("formats standard date to YYYY-MM-DD", () => {
    const date1 = new Date(2026, 0, 5); // Jan 5, 2026
    expect(formatDateToIso(date1)).toBe("2026-01-05");

    const date2 = new Date(2026, 11, 25); // Dec 25, 2026
    expect(formatDateToIso(date2)).toBe("2026-12-25");
  });
});





