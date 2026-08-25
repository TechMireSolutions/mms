const fs = require('fs');
let content = fs.readFileSync('apps/frontend/src/tenant/features/contacts/components/ContactForm.tsx', 'utf8');

// replace draft.fieldConfig?.formTabs logic
const baseTabsStart = content.indexOf('const baseTabs = draft.fieldConfig?.formTabs && draft.fieldConfig.formTabs.length > 0');
const baseTabsEnd = content.indexOf('      : DEFAULT_CONTACT_FORM_MODAL_TABS;') + '      : DEFAULT_CONTACT_FORM_MODAL_TABS;'.length;

const newBaseTabs = `const baseTabs = DEFAULT_CONTACT_FORM_MODAL_TABS;`;
if (baseTabsStart > -1) {
  content = content.substring(0, baseTabsStart) + newBaseTabs + content.substring(baseTabsEnd);
}

// remove draft.fieldConfig?.formTabs from dependency array
content = content.replace(/draft\.fieldConfig\?\.formTabs, /g, '');

fs.writeFileSync('apps/frontend/src/tenant/features/contacts/components/ContactForm.tsx', content, 'utf8');
