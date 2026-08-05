import { describe, expect, it } from "vitest";
import { CONTACT_LEGACY_CUSTOM_FORM_TAB, DEFAULT_FORM_TABS } from "@mms/shared";
import {
  mapCustomTabApiRowToTabDefinition,
  mergeContactsFormTabsFromApi,
} from "./contactsCustomTabsApi";

describe("mapCustomTabApiRowToTabDefinition", () => {
  it("maps API row fields and restores system labelKey from defaults", () => {
    expect(
      mapCustomTabApiRowToTabDefinition({
        id: "demo:contacts:basic",
        key: "basic",
        label: "Identity",
        enabled: true,
        sortOrder: 0,
        isSystem: true,
      }),
    ).toMatchObject({
      key: "basic",
      label: "Identity",
      labelKey: "contacts.form.tabBasic",
      enabled: true,
      order: 0,
      isSystem: true,
    });
  });

  it("maps legacy custom seed tab labelKey from CONTACT_LEGACY_CUSTOM_FORM_TAB", () => {
    expect(
      mapCustomTabApiRowToTabDefinition({
        id: "demo:contacts:custom",
        key: "custom",
        label: "Custom fields",
        enabled: true,
        sortOrder: 6,
        isSystem: true,
      }),
    ).toMatchObject({
      key: "custom",
      label: "Custom fields",
      labelKey: CONTACT_LEGACY_CUSTOM_FORM_TAB.labelKey,
      order: 6,
      isSystem: true,
    });
  });

  it("maps custom collection tabs without inventing labelKey", () => {
    expect(
      mapCustomTabApiRowToTabDefinition({
        id: "demo:contacts:custom_notes",
        key: "custom_notes",
        label: "Notes",
        enabled: true,
        sortOrder: 10,
        isSystem: false,
      }),
    ).toEqual({
      key: "custom_notes",
      label: "Notes",
      labelKey: undefined,
      icon: undefined,
      enabled: true,
      order: 10,
      permissions: undefined,
      description: undefined,
      color: undefined,
      isSystem: false,
    });
  });
});

describe("mergeContactsFormTabsFromApi", () => {
  it("returns document/default tabs when API is empty", () => {
    expect(mergeContactsFormTabsFromApi(undefined, [])).toEqual([...DEFAULT_FORM_TABS]);
    expect(
      mergeContactsFormTabsFromApi([{ key: "basic", label: "X", enabled: true, order: 0 }], []),
    ).toEqual([{ key: "basic", label: "X", enabled: true, order: 0 }]);
  });

  it("prefers API rows and fills missing seed tabs without empty custom", () => {
    const apiTabs = [
      mapCustomTabApiRowToTabDefinition({
        id: "1",
        key: "custom_notes",
        label: "Notes",
        sortOrder: 0,
        enabled: true,
      }),
      mapCustomTabApiRowToTabDefinition({
        id: "2",
        key: "basic",
        label: "Identity",
        sortOrder: 1,
        enabled: true,
        isSystem: true,
      }),
      mapCustomTabApiRowToTabDefinition({
        id: "3",
        key: "custom",
        label: "Custom fields",
        sortOrder: 6,
        enabled: true,
        isSystem: true,
      }),
    ];
    const merged = mergeContactsFormTabsFromApi(DEFAULT_FORM_TABS, apiTabs);
    expect(merged.map((tab) => tab.key)).toEqual([
      "custom_notes",
      "basic",
      "phones",
      "emails",
      "addresses",
      "socials",
      "relationship",
    ]);
  });

  it("does not resurrect document-only custom tabs omitted from API", () => {
    const documentTabs = [
      ...DEFAULT_FORM_TABS,
      { key: "custom_notes", label: "Notes", enabled: true, order: 10, isSystem: false },
    ];
    const apiTabs = DEFAULT_FORM_TABS.map((tab) =>
      mapCustomTabApiRowToTabDefinition({
        id: `demo:contacts:${tab.key}`,
        key: tab.key,
        label: tab.label,
        sortOrder: tab.order,
        enabled: true,
        isSystem: true,
      }),
    );
    const merged = mergeContactsFormTabsFromApi(documentTabs, apiTabs);
    expect(merged.map((tab) => tab.key)).toEqual(DEFAULT_FORM_TABS.map((tab) => tab.key));
    expect(merged.map((tab) => tab.key)).not.toContain("custom_notes");
  });

  it("keeps legacy custom when fields still exist under that tab", () => {
    const apiTabs = [
      mapCustomTabApiRowToTabDefinition({
        id: "3",
        key: "custom",
        label: "Custom fields",
        sortOrder: 6,
        enabled: true,
        isSystem: true,
      }),
    ];
    const merged = mergeContactsFormTabsFromApi(DEFAULT_FORM_TABS, apiTabs, {
      custom: [{ key: "extra", label: "Extra", type: "text", enabled: true, order: 0 }],
    });
    expect(merged.map((tab) => tab.key)).toContain("custom");
    expect(merged.find((tab) => tab.key === "custom")?.label).toBe("Custom");
  });
});
