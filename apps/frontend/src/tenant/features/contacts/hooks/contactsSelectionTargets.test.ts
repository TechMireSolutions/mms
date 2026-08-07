import { describe, expect, it } from "vitest";
import type { Contact } from "@mms/shared";
import { computeContactsSelectionTargets } from "@/tenant/features/contacts/hooks/contactsSelectionTargets";

function contact(partial: Partial<Contact> & { id: string }): Contact {
  return {
    firstName: "Test",
    lastName: "User",
    ...partial,
  } as Contact;
}

describe("computeContactsSelectionTargets", () => {
  it("returns empty buckets when nothing is selected", () => {
    const result = computeContactsSelectionTargets({
      selectedIds: [],
      workContacts: [contact({ id: "1", phone: "+923001234567" })],
    });
    expect(result).toEqual({ waTargets: [], smsReady: [] });
  });

  it("filters current-page selected rows by channel eligibility", () => {
    const withPhone = contact({ id: "1", phone: "+923001234567" });
    const neither = contact({ id: "2" });
    const result = computeContactsSelectionTargets({
      selectedIds: ["1", "2", "missing"],
      workContacts: [withPhone, neither],
    });
    expect(result.smsReady.map((row) => row.id)).toEqual(["1"]);
    expect(result.waTargets.map((row) => row.id)).toEqual(["1"]);
  });
});
