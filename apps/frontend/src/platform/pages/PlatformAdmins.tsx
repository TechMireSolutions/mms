import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ModuleScaffold } from '@/components/common/ModuleScaffold';
import { PlatformAdminsContent } from '@/platform/components/PlatformAdminsContent';
import { PlatformAddAdminForm } from '@/platform/pages/PlatformAddAdminForm';
import { containerVariantsConsole as containerVariants, itemVariants } from '@/platform/lib/animations';

export default function PlatformAdmins(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <ModuleScaffold
      seoTitle={`${t('platform.adminsTitle')} | ${t('platform.consoleTitle')}`}
      seoDescription={t('platform.adminsSubtitle')}
      headerIcon={ShieldCheck}
      headerTitle={t('platform.adminsTitle')}
      headerSubtitle={t('platform.adminsSubtitle')}
      headerActions={<PlatformAddAdminForm asTriggerOnly />}
    >
      <motion.div
        variants={containerVariants}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <PlatformAdminsContent />
        </motion.div>
      </motion.div>
    </ModuleScaffold>
  );
}
