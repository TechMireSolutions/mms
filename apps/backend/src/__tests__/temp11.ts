import { cleanContactDraft, hydrateContactRelationshipFields, stripContactClientSoftDeleteFields, getContactTags } from '@mms/shared';
const draft = { tag: 'VIP' };
const result = hydrateContactRelationshipFields(stripContactClientSoftDeleteFields({ ...draft }) as any);
console.log('result tags:', result.tags);
console.log('result tag:', result.tag);
console.log('getContactTags(result):', getContactTags(result));
