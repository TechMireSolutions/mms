const fs = require('fs');

let rContent = fs.readFileSync('apps/frontend/src/tenant/features/reports/components/useCustomReportBuilderState.ts', 'utf8');
rContent = rContent.replace(/const \{ fieldConfig \} = useContactConfig\(\);\n/g, '');
rContent = rContent.replace(/fieldConfig\.fields/g, '{}');
rContent = rContent.replace(/fieldConfig\.formTabs \?\? \[\]/g, '[]');
rContent = rContent.replace(/, fieldConfig\.formTabs/g, '');
fs.writeFileSync('apps/frontend/src/tenant/features/reports/components/useCustomReportBuilderState.ts', rContent, 'utf8');

let pContent = fs.readFileSync('apps/frontend/src/tenant/features/profile/hooks/useAccountProfilePageController.ts', 'utf8');
pContent = pContent.replace(/const \{ fieldConfig \} = useContactConfig\(\);\n/g, '');
pContent = pContent.replace(/if \(\!profile\?\.contact \|\| \!fieldConfig\) return 0;/g, 'if (!profile?.contact) return 0;');
pContent = pContent.replace(/calculateProfileCompleteness\(profile\.contact, fieldConfig\)/g, 'calculateProfileCompleteness(profile.contact, { fields: {} })');
pContent = pContent.replace(/, fieldConfig/g, '');
fs.writeFileSync('apps/frontend/src/tenant/features/profile/hooks/useAccountProfilePageController.ts', pContent, 'utf8');

