import React from 'react';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import type { Teacher } from '@mms/shared';
import type {
  SessionClassSchedule,
  SessionClassTimetablePeriod,
} from '@/lib/data/sessionsData';
import { formatTeacherDisplayName } from './types';

interface ClassDetailScheduleTabProps {
  schedules: SessionClassSchedule[];
  periods: SessionClassTimetablePeriod[];
  allTeachers: Teacher[];
  onAddSchedule: () => void;
  onRemoveSchedule: (id: string) => void;
  onUpdateSchedule: (id: string, patch: Partial<SessionClassSchedule>) => void;
  onAddPeriod: () => void;
  onRemovePeriod: (id: string) => void;
  onUpdatePeriod: (id: string, patch: Partial<SessionClassTimetablePeriod>) => void;
}

export function ClassDetailScheduleTab({
  schedules,
  periods,
  allTeachers,
  onAddSchedule,
  onRemoveSchedule,
  onUpdateSchedule,
  onAddPeriod,
  onRemovePeriod,
  onUpdatePeriod,
}: ClassDetailScheduleTabProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Schedules Card */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Class Schedule Dates</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddSchedule} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Schedule Block
          </Button>
        </div>

        {schedules.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            No custom schedule block. Session start/end dates will apply.
          </p>
        ) : (
          <div className="space-y-2">
            {schedules.map((sch) => (
              <div key={sch.id} className="flex items-center gap-2">
                <FormSelect
                  id={`sch-type-${sch.id}`}
                  name="scheduleType"
                  value={sch.scheduleType}
                  onChange={(val) => onUpdateSchedule(sch.id, { scheduleType: val })}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                  className="w-40 min-w-[150px] shrink-0 text-xs"
                />
                <Input
                  type="date"
                  value={sch.startDate}
                  onChange={(e) => onUpdateSchedule(sch.id, { startDate: e.target.value })}
                  className="text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={sch.endDate}
                  onChange={(e) => onUpdateSchedule(sch.id, { endDate: e.target.value })}
                  className="text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveSchedule(sch.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timetable Periods */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-semibold text-foreground">Timetable & Period Breakdown</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddPeriod} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Period
          </Button>
        </div>

        {periods.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            No periods defined yet. Click "Add Period" to specify class subjects, timings, and instructors.
          </p>
        ) : (
          <div className="space-y-2">
            {periods.map((period) => (
              <div key={period.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Input
                  type="time"
                  value={period.startTime}
                  onChange={(e) => onUpdatePeriod(period.id, { startTime: e.target.value })}
                  className="w-28 text-xs"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={period.endTime}
                  onChange={(e) => onUpdatePeriod(period.id, { endTime: e.target.value })}
                  className="w-28 text-xs"
                />
                <Input
                  placeholder="Subject (e.g. Hifz, Tajweed, Fiqh)"
                  value={period.subject}
                  onChange={(e) => onUpdatePeriod(period.id, { subject: e.target.value })}
                  className="flex-1 text-xs"
                />
                <FormSelect
                  id={`period-teacher-${period.id}`}
                  name="teacherName"
                  value={period.teacherName || ''}
                  onChange={(val) => {
                    const found = allTeachers.find(
                      (t) => formatTeacherDisplayName(t) === val || (t.name || '').trim() === val,
                    );
                    onUpdatePeriod(period.id, {
                      teacherName: val,
                      teacherId: found?.id ? String(found.id) : period.teacherId,
                    });
                  }}
                  options={[
                    { value: '', label: 'Select Teacher' },
                    ...allTeachers.map((t) => {
                      const label = formatTeacherDisplayName(t);
                      return {
                        value: label,
                        label,
                      };
                    }),
                  ]}
                  className="w-44 min-w-[160px] shrink-0 text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemovePeriod(period.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
