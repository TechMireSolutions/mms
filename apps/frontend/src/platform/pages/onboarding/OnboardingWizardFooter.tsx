import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/config/routes";
import { tenantUrl } from "@/lib/config/tenantConfig";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface OnboardingWizardFooterProps {
  t: TranslationFunction;
  step: number;
  loading: boolean;
  submitError: string | null;
  showSignInLink: boolean;
  conflictSubdomain: string;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function OnboardingWizardFooter({
  t,
  step,
  loading,
  submitError,
  showSignInLink,
  conflictSubdomain,
  isLastStep,
  onBack,
  onNext,
}: OnboardingWizardFooterProps) {
  const signInHref =
    showSignInLink && conflictSubdomain.trim()
      ? tenantUrl(conflictSubdomain.trim().toLowerCase(), ROUTES.login)
      : null;

  return (
    <>
      {submitError ? (
        <Alert
          className="mt-4"
          message={
            <>
              {submitError}{" "}
              {signInHref ? (
                <a
                  href={signInHref}
                  className="inline-flex min-h-11 items-center font-semibold underline"
                >
                  {t("onboarding.signInInstead")}
                </a>
              ) : null}
            </>
          }
        />
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-border/50 pt-5">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
          disabled={step === 1 || loading}
          className="h-11 gap-1.5 rounded-xl text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {t("onboarding.back")}
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={loading}
          className="h-11 gap-1.5 rounded-xl px-5 font-semibold shadow-md shadow-primary/10"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("common.loading")}
            </>
          ) : (
            <>
              {isLastStep ? t("onboarding.createWorkspace") : t("onboarding.continue")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </>
  );
}
