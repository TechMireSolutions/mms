import React from 'react';
import { Award, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { useTranslation } from '@/hooks/useTranslation';
import type { SessionClassScholarship } from '@/lib/data/sessionsData';

interface ClassDetailScholarshipTabProps {
  scholarship: SessionClassScholarship;
  onUpdateScholarship: (patch: Partial<SessionClassScholarship>) => void;
  onUpdateEligibility: (
    patch: Partial<NonNullable<SessionClassScholarship['eligibility']>>,
  ) => void;
}

export function ClassDetailScholarshipTab({
  scholarship,
  onUpdateScholarship,
  onUpdateEligibility,
}: ClassDetailScholarshipTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const eligibility = scholarship.eligibility;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-secondary" />
          <h4 className="text-sm font-semibold text-foreground">{t('sessions.classes.detail.scholarship.rateTitle')}</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FORM_LABEL} htmlFor="sch-pct">
              {t('sessions.classes.detail.scholarship.percentage')}
            </label>
            <div className="relative">
              <Input
                id="sch-pct"
                type="number"
                min={0}
                max={100}
                value={scholarship.percentage ?? 0}
                onChange={(e) =>
                  onUpdateScholarship({ percentage: parseFloat(e.target.value) || 0 })
                }
                className="pe-6"
              />
              <span className="absolute end-3 top-2.5 text-xs text-muted-foreground">%</span>
            </div>
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="sch-expiry">
              {t('sessions.classes.detail.scholarship.expiry')}
            </label>
            <Input
              id="sch-expiry"
              type="date"
              value={scholarship.expiryDate || ''}
              onChange={(e) => onUpdateScholarship({ expiryDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Eligibility Matrix */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">{t('sessions.classes.detail.scholarship.criteriaTitle')}</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 cursor-pointer">
            <Checkbox
              checked={Boolean(eligibility?.orphan)}
              onCheckedChange={(checked) => onUpdateEligibility({ orphan: checked === true })}
              className="h-4 w-4"
            />
            <div>
              <p className="text-xs font-medium text-foreground">{t('sessions.classes.detail.scholarship.orphan')}</p>
              <p className="text-3xs text-muted-foreground">{t('sessions.classes.detail.scholarship.orphanHint')}</p>
            </div>
          </label>

          <div>
            <label className={FORM_LABEL} htmlFor="residence-type">
              {t('sessions.classes.detail.scholarship.residence')}
            </label>
            <FormSelect
              id="residence-type"
              name="residence"
              value={eligibility?.residence || 'rental'}
              onChange={(val) => onUpdateEligibility({ residence: val })}
              options={[
                { value: 'rental', label: t('sessions.classes.detail.scholarship.residence.rental') },
                { value: 'owned', label: t('sessions.classes.detail.scholarship.residence.owned') },
                { value: 'relative', label: t('sessions.classes.detail.scholarship.residence.relative') },
                { value: 'other', label: t('sessions.classes.detail.scholarship.residence.other') },
              ]}
              className="w-full text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="family-members">
              {t('sessions.classes.detail.scholarship.familyMembers')}
            </label>
            <Input
              id="family-members"
              type="number"
              min={0}
              value={eligibility?.familyMembers ?? 0}
              onChange={(e) =>
                onUpdateEligibility({ familyMembers: parseInt(e.target.value, 10) || 0 })
              }
              className="text-xs"
            />
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="earning-members">
              {t('sessions.classes.detail.scholarship.earningMembers')}
            </label>
            <Input
              id="earning-members"
              type="number"
              min={0}
              value={eligibility?.onJobMembers ?? 0}
              onChange={(e) =>
                onUpdateEligibility({ onJobMembers: parseInt(e.target.value, 10) || 0 })
              }
              className="text-xs"
            />
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="studying-siblings">
              {t('sessions.classes.detail.scholarship.siblings')}
            </label>
            <Input
              id="studying-siblings"
              type="number"
              min={0}
              value={eligibility?.schoolGoingSiblings ?? 0}
              onChange={(e) =>
                onUpdateEligibility({ schoolGoingSiblings: parseInt(e.target.value, 10) || 0 })
              }
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
