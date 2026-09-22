import { useState } from 'react';
import { Award, Plus } from 'lucide-react';
import type { FacultyDesignationDefinition } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/FormPrimitives';
import { FORM_INPUT } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { SectionCard } from '@/components/ui/SectionCard';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useFacultyDesignations, useSaveFacultyDesignation } from '../hooks/useFacultyDesignations';

type Draft = Pick<FacultyDesignationDefinition, 'id' | 'code' | 'name' | 'hierarchyRank' | 'isActive' | 'assignableRoles'>;

const EMPTY_DRAFT: Draft = { id: '', code: '', name: '', hierarchyRank: 4, isActive: true, assignableRoles: [] };

/** Dynamic designation catalog, including authority rank and allowed workspace roles. */
export function FacultyDesignationsSetupSection(): React.JSX.Element {
  const { t } = useTranslation();
  const query = useFacultyDesignations();
  const save = useSaveFacultyDesignation();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [rolesText, setRolesText] = useState('');

  const edit = (designation: FacultyDesignationDefinition) => {
    setDraft(designation);
    setRolesText(designation.assignableRoles.join(', '));
  };

  const reset = () => {
    setDraft(EMPTY_DRAFT);
    setRolesText('');
  };

  const submit = async () => {
    const name = draft.name.trim();
    const code = draft.code.trim();
    if (!name || !code) return;
    await save.mutateAsync({
      ...draft,
      id: draft.id || crypto.randomUUID(),
      name,
      code,
      assignableRoles: [...new Set(rolesText.split(',').map((role) => role.trim()).filter(Boolean))],
    });
    notify.success(t('faculty.designations.saved'));
    reset();
  };

  return (
    <SectionCard title={t('faculty.designations.setupTitle')} icon={Award} accentColor="primary">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('faculty.designations.setupHint')}</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t('faculty.designations.name')} id="designation-name" required>
            <Input id="designation-name" className={FORM_INPUT} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <Field label={t('faculty.designations.code')} id="designation-code" required>
            <Input id="designation-code" className={FORM_INPUT} value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} />
          </Field>
          <Field label={t('faculty.form.hierarchyRank')} id="designation-rank" required>
            <Input id="designation-rank" className={FORM_INPUT} type="number" min={1} max={99} value={draft.hierarchyRank} onChange={(event) => setDraft((current) => ({ ...current, hierarchyRank: Number(event.target.value) || 1 }))} />
          </Field>
          <Field label={t('faculty.designations.roles')} id="designation-roles">
            <Input id="designation-roles" className={FORM_INPUT} value={rolesText} onChange={(event) => setRolesText(event.target.value)} placeholder={t('faculty.designations.rolesHint')} />
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {draft.id && <Button type="button" variant="outline" onClick={reset}>{t('common.cancel')}</Button>}
          <Button type="button" onClick={() => void submit()} disabled={save.isPending || !draft.name.trim() || !draft.code.trim()}>
            <Plus className="size-4" aria-hidden />
            {t('common.save')}
          </Button>
        </div>
        <div className="divide-y divide-border rounded-md border">
          {(query.data ?? []).map((designation) => (
            <button key={designation.id} type="button" className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-start hover:bg-muted/50" onClick={() => edit(designation)}>
              <span>
                <span className="block font-medium">{designation.name}</span>
                <span className="block text-xs text-muted-foreground">{designation.code} · {t('faculty.form.hierarchyRank')} {designation.hierarchyRank}</span>
              </span>
              <span className="text-xs text-muted-foreground">{designation.assignableRoles.join(', ') || t('common.none')}</span>
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
