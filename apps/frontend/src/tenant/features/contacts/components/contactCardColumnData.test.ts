import { describe, expect, it } from "vitest";
import type { Contact } from "@mms/shared";
import { hasContactCardColumnData } from "@/tenant/features/contacts/components/contactCardColumnData";

describe("hasContactCardColumnData", () => {
  it("returns true/false for dob columns from the contact dob", () => {
    expect(hasContactCardColumnData({ id: 1, dob: "1990-01-01" } as Contact, "dob")).toBe(true);
    expect(hasContactCardColumnData({ id: 1 } as Contact, "solarDob")).toBe(false);
    expect(hasContactCardColumnData({ id: 1, dob: "1990-01-01" } as Contact, "lunarDob")).toBe(true);
  });

  it("detects whatsapp via the primary phone number id", () => {
    expect(
      hasContactCardColumnData(
        { id: 1, phones: [{ isPrimary: true, number: "+923001234567" }] } as Contact,
        "whatsapp",
      ),
    ).toBe(true);
    expect(hasContactCardColumnData({ id: 1 } as Contact, "whatsapp")).toBe(false);
  });

  it("detects gender and isSyed presence", () => {
    expect(hasContactCardColumnData({ id: 1, gender: "male" } as Contact, "gender")).toBe(true);
    expect(hasContactCardColumnData({ id: 1 } as Contact, "gender")).toBe(false);
    expect(hasContactCardColumnData({ id: 1, isSyed: true } as Contact, "isSyed")).toBe(true);
    expect(hasContactCardColumnData({ id: 1 } as Contact, "isSyed")).toBe(false);
  });

  it("detects socials rows by platform and url", () => {
    expect(
      hasContactCardColumnData({ id: 1, socials: [{ platform: "Facebook", url: "fb.com/a" }] } as Contact, "socials_platform"),
    ).toBe(true);
    expect(hasContactCardColumnData({ id: 1, socials: [{ platform: "Facebook", url: "" }] } as Contact, "socials_url")).toBe(false);
    expect(hasContactCardColumnData({ id: 1 } as Contact, "socials_platform")).toBe(false);
  });

  it("falls back to the primary address for address scalars", () => {
    expect(
      hasContactCardColumnData(
        { id: 1, addresses: [{ line1: "12 Main St", isPrimary: true }] } as Contact,
        "city",
      ),
    ).toBe(false);
    expect(
      hasContactCardColumnData(
        { id: 1, addresses: [{ city: "Lahore", isPrimary: true }] } as Contact,
        "city",
      ),
    ).toBe(true);
    expect(hasContactCardColumnData({ id: 1, city: "Lahore" } as unknown as Contact, "city")).toBe(true);
  });

  it("detects relationship columns by name/contactId and relationship type", () => {
    expect(
      hasContactCardColumnData(
        { id: 1, relationshipContacts: [{ relationship: "parent", name: "Ali", contactId: "9" }] } as Contact,
        "relationship_contact",
      ),
    ).toBe(true);
    expect(
      hasContactCardColumnData(
        { id: 1, relationshipContacts: [{ relationship: "parent", name: "", contactId: "" }] } as Contact,
        "relationship_contact",
      ),
    ).toBe(false);
    expect(
      hasContactCardColumnData(
        { id: 1, relationshipContacts: [{ relationship: "parent" }] } as Contact,
        "relationship_type",
      ),
    ).toBe(true);
  });

  it("handles booleans, numbers, and arrays in the default branch", () => {
    const contact = { id: 1, customBoolean: true, childrenCount: 3, customTags: ["a"] } as unknown as Contact;
    expect(hasContactCardColumnData(contact, "customBoolean")).toBe(true);
    expect(hasContactCardColumnData({ id: 1, customBoolean: false } as unknown as Contact, "customBoolean")).toBe(true);
    expect(hasContactCardColumnData(contact, "childrenCount")).toBe(true);
    expect(hasContactCardColumnData(contact, "customTags")).toBe(true);
    expect(hasContactCardColumnData({ id: 1, customTags: [] } as unknown as Contact, "customTags")).toBe(false);
  });
});
