const fs = require('fs');

let content = fs.readFileSync('apps/frontend/src/tenant/features/contacts/hooks/useContactFormDraft.ts', 'utf8');

// Remove from useContactConfig
content = content.replace(/    isTabFieldEnabled,\n/g, '');
content = content.replace(/    isTabFieldRequired,\n/g, '');
content = content.replace(/    enabledTabIds,\n/g, '');
content = content.replace(/    fieldConfig,\n/g, '');
content = content.replace(/    fields,\n/g, '');
content = content.replace(/    fields,/g, '');

// from buildInitialContactDraft call
content = content.replace(/      fields,\n/g, '');

// from useContactFormDraftHelpers call
content = content.replace(/    isTabFieldEnabled,\n/g, '');
content = content.replace(/    isTabFieldRequired,\n/g, '');

// from return
content = content.replace(/    enabledTabIds,\n/g, '');
content = content.replace(/    fieldConfig,\n/g, '');
content = content.replace(/    fields,\n/g, '');

fs.writeFileSync('apps/frontend/src/tenant/features/contacts/hooks/useContactFormDraft.ts', content, 'utf8');
