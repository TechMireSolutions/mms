import fs from 'fs';
import path from 'path';

// Students
{
  const pageViewPath = 'apps/frontend/src/tenant/features/students/components/StudentsPageView.tsx';
  let content = fs.readFileSync(pageViewPath, 'utf8');
  content = content.replace(
    'import { StudentsPageTabPanel } from "@/tenant/features/students/components/StudentsPageTabPanel";',
    `import { AnimatePresence } from "framer-motion";
import { StudentsReportsTier } from "@/tenant/features/students/components/StudentsReportsTier";
import StudentsSetupTier from "@/tenant/features/students/components/StudentsSetupTier";
import { StudentsWorkTier } from "@/tenant/features/students/components/StudentsWorkTier";`
  );
  content = content.replace(
    '<StudentsPageTabPanel {...tabPanelProps} />',
    `<AnimatePresence mode="wait">
          {activeTab === "work" ? (
            <StudentsWorkTier {...tabPanelProps.workTierProps} />
          ) : activeTab === "reports" ? (
            <StudentsReportsTier />
          ) : activeTab === "setup" ? (
            <StudentsSetupTier />
          ) : null}
        </AnimatePresence>`
  );
  fs.writeFileSync(pageViewPath, content);
  
  // Clean up
  const oldTabPanelPath = 'apps/frontend/src/tenant/features/students/components/StudentsPageTabPanel.tsx';
  if (fs.existsSync(oldTabPanelPath)) fs.unlinkSync(oldTabPanelPath);
}

// Contacts
{
  const pageViewPath = 'apps/frontend/src/tenant/features/contacts/components/ContactsPageView.tsx';
  if (fs.existsSync(pageViewPath)) {
    let content = fs.readFileSync(pageViewPath, 'utf8');
    content = content.replace(
      'import { ContactsPageTabPanel } from "@/tenant/features/contacts/components/ContactsPageTabPanel";',
      `import { AnimatePresence } from "framer-motion";
import ContactsSetupTier from "@/tenant/features/contacts/components/ContactsSetupTier";
import { ContactsWorkTier } from "@/tenant/features/contacts/components/ContactsWorkTier";`
    );
    // Note: Contacts doesn't have a ReportsTier! Let's check what it has.
    content = content.replace(
      '<ContactsPageTabPanel {...tabPanelProps} />',
      `<AnimatePresence mode="wait">
          {activeTab === "work" ? (
            <ContactsWorkTier {...tabPanelProps.workTierProps} />
          ) : activeTab === "setup" ? (
            <ContactsSetupTier {...tabPanelProps.settingsPanelProps} />
          ) : null}
        </AnimatePresence>`
    );
    fs.writeFileSync(pageViewPath, content);
    
    // Clean up
    const oldTabPanelPath = 'apps/frontend/src/tenant/features/contacts/components/ContactsPageTabPanel.tsx';
    if (fs.existsSync(oldTabPanelPath)) fs.unlinkSync(oldTabPanelPath);
  }
}

// Teachers
{
  const pageViewPath = 'apps/frontend/src/tenant/features/teachers/components/TeachersPageView.tsx';
  if (fs.existsSync(pageViewPath)) {
    let content = fs.readFileSync(pageViewPath, 'utf8');
    content = content.replace(
      'import { TeachersPageTabPanel } from "@/tenant/features/teachers/components/TeachersPageTabPanel";',
      `import { AnimatePresence } from "framer-motion";
import { TeachersReportsTier } from "@/tenant/features/teachers/components/TeachersReportsTier";
import { TeachersSetupTier } from "@/tenant/features/teachers/components/TeachersSetupTier";
import { TeachersWorkTier } from "@/tenant/features/teachers/components/TeachersWorkTier";`
    );
    content = content.replace(
      '<TeachersPageTabPanel {...tabPanelProps} />',
      `<AnimatePresence mode="wait">
          {activeTab === "work" ? (
            <TeachersWorkTier {...tabPanelProps.workTierProps} />
          ) : activeTab === "reports" ? (
            <TeachersReportsTier />
          ) : activeTab === "setup" ? (
            <TeachersSetupTier />
          ) : null}
        </AnimatePresence>`
    );
    fs.writeFileSync(pageViewPath, content);
    
    // Clean up
    const oldTabPanelPath = 'apps/frontend/src/tenant/features/teachers/components/TeachersPageTabPanel.tsx';
    if (fs.existsSync(oldTabPanelPath)) fs.unlinkSync(oldTabPanelPath);
  }
}
