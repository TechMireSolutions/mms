const fs = require('fs');

let content = fs.readFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsSettingsPanel.tsx', 'utf8');

// replace the hook call
content = content.replace(/const { fieldConfig, updateConfig, updateConfigAsync } = useContactConfig\(\);\n/g, 'const { settings, updateSettings, updateSettingsAsync } = useContactConfig();\n');

// replace settingsSubTabs definition
const tabsStart = content.indexOf('const settingsSubTabs = useMemo(() => {');
const tabsEnd = content.indexOf('  }, [fieldConfig.settingsSubTabs, t]);') + '  }, [fieldConfig.settingsSubTabs, t]);'.length;

const newTabs = `const settingsSubTabs = useMemo(() => {
    const defaultByKey = new Map(DEFAULT_SETTINGS_SUB_TABS.map((tab) => [tab.key, tab]));
    return CONTACTS_MODULE_MANIFEST.setupSubTabs
      .map((key, index) => {
        const seedTab = defaultByKey.get(key);
        const labelSource = {
          label: seedTab?.label ?? key,
          labelKey: seedTab?.labelKey,
        };
        return {
          key,
          label: resolveRegistryLabel(labelSource, t),
          order: seedTab?.order ?? index,
          enabled: seedTab?.enabled ?? true,
        };
      })
      .filter((tab) => tab.enabled)
      .sort((a, b) => a.order - b.order);
  }, [t]);`;

if (tabsStart > -1) {
  content = content.substring(0, tabsStart) + newTabs + content.substring(tabsEnd);
}

// ContactsSetupPanel props
content = content.replace(/config=\{fieldConfig\}/g, 'config={{}}');
content = content.replace(/onConfigChange=\{updateConfig\}/g, 'onConfigChange={() => {}}');
content = content.replace(/onConfigChangeAsync=\{updateConfigAsync\}/g, 'onConfigChangeAsync={async () => {}}');

fs.writeFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsSettingsPanel.tsx', content, 'utf8');
