import { cleanContactDraft, stripContactClientSoftDeleteFields, hydrateContactRelationshipFields, getContactTags } from '@mms/shared';
function fakeContact(id: string, overrides: any = {}) {
  return {
    id,
    name: `Contact ${id}`,
    firstName: 'Contact',
    lastName: id,
    relationshipContacts: [],
    relationships: [],
    ...overrides,
  };
}
const draft = fakeContact('c1', {
  persona: 'student',
  lifecycleStage: 'lead',
  tag: 'VIP',
});
console.log('draft:', draft);
const step1 = stripContactClientSoftDeleteFields({ ...draft });
console.log('step1:', step1);
const step2 = hydrateContactRelationshipFields(step1 as any);
console.log('step2:', step2);
console.log('getContactTags(step2):', getContactTags(step2));
