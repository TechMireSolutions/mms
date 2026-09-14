import React from 'react';
import { Award, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL } from '@/components/ui/formStyles';
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
  const eligibility = scholarship.eligibility;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-purple-600" />
          <h4 className="text-sm font-semibold text-foreground">Scholarship Rate & Terms</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FORM_LABEL} htmlFor="sch-pct">
              Scholarship Coverage Percentage (%)
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
              Expiry / Renewal Date
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
          <h4 className="text-sm font-semibold text-foreground">Scholarship Eligibility Criteria</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(eligibility?.orphan)}
              onChange={(e) => onUpdateEligibility({ orphan: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <div>
              <p className="text-xs font-medium text-foreground">Orphan Student</p>
              <p className="text-[11px] text-muted-foreground">Eligible for full sponsorship</p>
            </div>
          </label>

          <div>
            <label className={FORM_LABEL} htmlFor="residence-type">
              Residence Status
            </label>
            <FormSelect
              id="residence-type"
              name="residence"
              value={eligibility?.residence || 'rental'}
              onChange={(val) => onUpdateEligibility({ residence: val })}
              options={[
                { value: 'rental', label: 'Rented Accommodation' },
                { value: 'owned', label: 'Self-Owned House' },
                { value: 'relative', label: 'Staying with Relatives' },
                { value: 'other', label: 'Other' },
              ]}
              className="w-full text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="family-members">
              Family Members
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
              Earning Members
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
              School-Going Siblings
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
