const fs = require('fs');

let content = fs.readFileSync('apps/frontend/src/tenant/features/contacts/hooks/useContactDetailViewModel.ts', 'utf8');

// replace from `const detailTabs = useMemo(() => {` to `}, [fieldConfig.detailTabs, enabledTabIds, t]);`
const oldTabsStart = content.indexOf('const detailTabs = useMemo(() => {');
const oldTabsEnd = content.indexOf('}, [fieldConfig.detailTabs, enabledTabIds, t]);') + '}, [fieldConfig.detailTabs, enabledTabIds, t]);'.length;

const newTabs = `const detailTabs = useMemo(() => {
    return Array.from(DEFAULT_DETAIL_TAB_BY_KEY.values()).map((tab) => ({
      key: tab.key,
      label: tab.labelKey ? t(tab.labelKey) : tab.label,
      icon: ICON_MAP[tab.icon || tab.key] || LayoutDashboard,
    }));
  }, [t]);`;

content = content.substring(0, oldTabsStart) + newTabs + content.substring(oldTabsEnd);

// clean up useContactConfig properties
content = content.replace(/const { enabledTabIds, isTabFieldEnabled, fieldConfig, fields } = useContactConfig\(\);\n/, 'const { enabledTabIds, isTabFieldEnabled, fields } = useContactConfig();\n');

fs.writeFileSync('apps/frontend/src/tenant/features/contacts/hooks/useContactDetailViewModel.ts', content, 'utf8');
