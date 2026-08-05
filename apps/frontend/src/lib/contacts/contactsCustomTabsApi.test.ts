import { describe, expect, it } from "vitest";
import { CONTACT_LEGACY_CUSTOM_FORM_TAB } from "@mms/shared";
import { mapCustomTabApiRowToTabDefinition } from "./contactsCustomTabsApi";

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
