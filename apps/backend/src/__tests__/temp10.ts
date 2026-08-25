import { cleanContactDraft, getContactTags } from '@mms/shared';
function fakeContact(id: string, overrides: any = {}) {
  return {
    id,
    ...overrides,
  };
}
const contact = fakeContact('c1', { tag: 'VIP' });
console.log(cleanContactDraft(contact));
