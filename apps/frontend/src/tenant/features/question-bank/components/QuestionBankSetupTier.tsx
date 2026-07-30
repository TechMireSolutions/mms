import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { QuestionBankSettings } from "@/tenant/features/question-bank/components/QuestionBankSettings";

interface SetupTab {
  id: string;
  label: string;
}

interface QuestionBankSetupTierProps {
  tabs: SetupTab[];
  activeTab: string;
  canEditSetup: boolean;
  onTabChange: (tab: string) => void;
}

export function QuestionBankSetupTier({
  tabs,
  activeTab,
  canEditSetup,
  onTabChange,
}: QuestionBankSetupTierProps) {
  const { t } = useTranslation();

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SubTabBar
          tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={activeTab}
          onChange={onTabChange}
        />
        {!canEditSetup ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
            {t("questionBank.setup.readOnly")}
          </p>
        ) : (
          <QuestionBankSettings mode={activeTab as "fields" | "preferences"} />
        )}
      </div>
    </ErrorBoundary>
  );
}
