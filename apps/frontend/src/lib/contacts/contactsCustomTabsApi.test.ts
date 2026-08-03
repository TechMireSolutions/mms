import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_TABS } from "@mms/shared";
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

  it("prefers API rows and appends missing base tabs", () => {
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
      "custom",
    ]);
  });
});
