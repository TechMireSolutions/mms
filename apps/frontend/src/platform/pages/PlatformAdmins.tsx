import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlatformPageShell } from '@/platform/components/PlatformPageShell';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlatformAdminsContent } from '@/platform/components/PlatformAdminsContent';
import { PlatformAddAdminForm } from '@/platform/pages/PlatformAddAdminForm';
import { containerVariantsConsole as containerVariants, itemVariants } from '@/platform/lib/animations';

export default function PlatformAdmins(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <PlatformPageShell width="7xl">
      <motion.div
        variants={containerVariants}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            icon={ShieldCheck}
            title={t('platform.adminsTitle')}
            subtitle={t('platform.adminsSubtitle')}
            actions={<PlatformAddAdminForm asTriggerOnly />}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <PlatformAdminsContent />
        </motion.div>
      </motion.div>
    </PlatformPageShell>
  );
}
