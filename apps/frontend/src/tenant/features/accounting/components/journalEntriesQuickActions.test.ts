import { describe, expect, it } from "vitest";
import { parseNaturalLanguage } from "@/tenant/features/accounting/components/journalEntriesQuickActions";

describe("parseNaturalLanguage", () => {
  it("maps common accounting phrases to quick actions", () => {
    expect(parseNaturalLanguage("collect monthly fee")?.id).toBe("fee_collection");
    expect(parseNaturalLanguage("pay staff salary")?.id).toBe("salary");
    expect(parseNaturalLanguage("received donation")?.id).toBe("donation");
    expect(parseNaturalLanguage("paid water utility")?.id).toBe("utilities");
    expect(parseNaturalLanguage("purchase classroom supplies")?.id).toBe("other_expense");
  });

  it("returns null when no quick action matches", () => {
    expect(parseNaturalLanguage("adjust opening balance")).toBeNull();
  });
});
