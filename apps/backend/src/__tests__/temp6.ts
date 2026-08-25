import { cleanContactDraft, getContactTags } from '@mms/shared';
const obj = { tag: 'VIP' };
console.log('getContactTags(obj):', getContactTags(obj));
console.log('cleanContactDraft(obj):', cleanContactDraft(obj));
