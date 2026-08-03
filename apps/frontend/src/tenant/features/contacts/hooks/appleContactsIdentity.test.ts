import { describe, expect, it } from "vitest";
import type { Contact } from "@mms/shared";
import { filterAppleImportFreshContacts } from "./appleContactsIdentity";

describe("filterAppleImportFreshContacts", () => {
  it("skips preview rows that match existing phones or emails", () => {
    const preview: Contact[] = [
      {
        id: "1",
        name: "A",
        firstName: "A",
        phones: [{ label: "Mobile", number: "3001234567", countryCode: "+92" }],
      },
      {
        id: "2",
        name: "B",
        firstName: "B",
        emails: [{ label: "Home", address: "b@example.com" }],
      },
      {
        id: "3",
        name: "C Only",
        firstName: "C",
        lastName: "Only",
      },
    ];

    const fresh = filterAppleImportFreshContacts(preview, {
      phones: ["3001234567"],
      emails: ["b@example.com"],
      names: ["c only"],
    });

    expect(fresh).toEqual([]);
  });

  it("keeps rows with no matching identity", () => {
    const preview: Contact[] = [
      {
        id: "1",
        name: "Fresh",
        firstName: "Fresh",
        phones: [{ label: "Mobile", number: "3009998877", countryCode: "+92" }],
      },
    ];

    const fresh = filterAppleImportFreshContacts(preview, {
      phones: ["3001234567"],
      emails: [],
      names: [],
    });

    expect(fresh).toHaveLength(1);
    expect(fresh[0]?.id).toBe("1");
  });
});
