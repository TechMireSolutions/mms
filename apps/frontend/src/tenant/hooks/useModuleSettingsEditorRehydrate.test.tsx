import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import type { FieldConfig, TabDefinition } from "@mms/shared";
import { useModuleSettingsEditor } from "./useModuleSettingsEditor";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type Editor = ReturnType<typeof useModuleSettingsEditor>["fieldsEditor"];

const LOCKED_TABS = ["basic"];
const noop = (): void => {};
const asyncNoop = async (): Promise<void> => {};

let editor: Editor | null = null;

function Harness({ settings }: { settings: FieldConfig }): React.JSX.Element {
  const tabRegistry = React.useMemo(
    () => (settings.formTabs ?? []) as TabDefinition[],
    [settings.formTabs],
  );
  const config = React.useMemo(
    () => ({ settings, updateSettings: noop, updateSettingsAsync: asyncNoop }),
    [settings],
  );
  const { fieldsEditor } = useModuleSettingsEditor({
    config,
    tabRegistry,
    lockedEnabledTabs: LOCKED_TABS,
  });
  editor = fieldsEditor;
  return <div />;
}

const persisted = {
  version: 2,
  enabledTabs: ["basic", "phones"],
  requiredTabs: [],
  fields: {
    basic: [{ key: "firstName", label: "First", type: "text", enabled: true, order: 0 }],
    phones: [{ key: "number", label: "Number", type: "text", enabled: true, order: 0 }],
  },
  formTabs: [
    { key: "basic", label: "Identity", enabled: true, order: 0, isSystem: true },
    { key: "phones", label: "Phones", enabled: true, order: 1, isSystem: true },
  ],
} as unknown as FieldConfig;

async function mount(settings: FieldConfig) {
  const root = createRoot(document.createElement("div"));
  await act(async () => {
    root.render(<Harness settings={settings} />);
  });
  return {
    root,
    rerender: async (next: FieldConfig) => {
      await act(async () => {
        root.render(<Harness settings={next} />);
      });
    },
  };
}

describe("useModuleSettingsEditor rehydrate", () => {
  it("keeps unsaved custom tab + field when a config reload lands mid-edit", async () => {
    const { root, rerender } = await mount(persisted);

    await act(async () => {
      editor!.handleAddTab("Education");
    });
    const tabId = editor!.formTabs.at(-1)!.key;

    await act(async () => {
      editor!.handleCustomFieldsChange(tabId, [
        {
          key: "cf_certificate",
          label: "Certificate",
          type: "text",
          enabled: true,
          order: 0,
          required: false,
          unique: false,
        },
      ]);
    });

    // Config reload after the tab landed in `custom_tabs` — field-config has no
    // fields for it yet, so a blind rehydrate would drop the unsaved field.
    await rerender({
      ...persisted,
      enabledTabs: ["basic", "phones", tabId],
      formTabs: [
        ...(persisted.formTabs ?? []),
        { key: tabId, label: "Education", enabled: true, order: 2, isSystem: false },
      ],
    } as unknown as FieldConfig);

    expect(editor!.tabFields[tabId]).toHaveLength(1);
    expect(editor!.buildFieldsMap()[tabId]).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
  });

  it("rehydrates persisted content while the draft is untouched", async () => {
    const { root, rerender } = await mount(persisted);

    await rerender({
      ...persisted,
      fields: {
        ...persisted.fields,
        phones: [
          { key: "number", label: "Number", type: "text", enabled: true, order: 0 },
          { key: "label", label: "Label", type: "text", enabled: true, order: 1 },
        ],
      },
    } as unknown as FieldConfig);

    expect(editor!.tabFields.phones).toHaveLength(2);

    await act(async () => {
      root.unmount();
    });
  });
});
