import fs from 'fs';

let content = fs.readFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsPageView.tsx', 'utf8');

// Insert import
content = content.replace(
  'import { ContactsWorkTier } from "@/tenant/features/contacts/components/ContactsWorkTier";',
  'import { ContactsWorkTier } from "@/tenant/features/contacts/components/ContactsWorkTier";\nimport { ContactsReportsTier } from "@/tenant/features/contacts/components/ContactsReportsTier";'
);

// Insert ReportsTier in AnimatePresence
content = content.replace(
  '{effectiveTab === "work" ? (',
  '{effectiveTab === "work" ? (\n            <ContactsWorkTier {...tabPanelProps.workTierProps} />\n          ) : effectiveTab === "reports" ? (\n            <ContactsReportsTier />\n          ) : effectiveTab === "setup" ? ('
);

// Remove the duplicated work tier that regex replacement might have created if not careful.
// Wait, my replace above will duplicate the ContactsWorkTier line if not matched carefully. 
// Let's rewrite safely.
