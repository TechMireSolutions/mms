import { cleanContactDraft } from '@mms/shared';
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
const contact = fakeContact('c1', {
  persona: 'student',
  lifecycleStage: 'lead',
  tag: 'VIP',
});
console.log(cleanContactDraft(contact));
