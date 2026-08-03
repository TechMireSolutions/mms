import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { KPISummary, ModuleReports } from "@/tenant/components/moduleReports";
import { ContactsWorkDirectory } from "@/tenant/features/contacts/components/ContactsWorkDirectory";
import type { ContactsWorkDirectoryProps } from "@/tenant/features/contacts/components/contactsWorkDirectoryTypes";
import type { Contact } from "@mms/shared";
import ContactsSettingsPanel from "@/tenant/features/contacts/components/ContactsSettingsPanel";

export interface ContactsPageTabPanelProps extends ContactsWorkDirectoryProps {
  effectiveTab: string;
  canWrite: boolean;
  canEditSetup: boolean;
  onImport: (list: Contact[]) => void | Promise<void>;
}

export function ContactsPageTabPanel({
  effectiveTab,
  canWrite,
  canEditSetup,
  onImport,
  ...directoryProps
}: ContactsPageTabPanelProps): JSX.Element {
  return (
    <AnimatePresence mode="wait">
      {effectiveTab === "work" ? (
        <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ContactsWorkDirectory {...directoryProps} canWrite={canWrite} />
        </motion.div>
      ) : effectiveTab === "reports" ? (
        <motion.div
          key="reports"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-4"
        >
          <ErrorBoundary>
            <div className="space-y-4">
              <KPISummary category="contacts" />
              <ModuleReports category="contacts" />
            </div>
          </ErrorBoundary>
        </motion.div>
      ) : effectiveTab === "setup" ? (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-4"
        >
          <ErrorBoundary>
            <ContactsSettingsPanel
              canWrite={canWrite}
              canEditSetup={canEditSetup}
              onImport={onImport}
            />
          </ErrorBoundary>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
