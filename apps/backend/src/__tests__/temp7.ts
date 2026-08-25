import { hydrateContactRelationshipFields, stripContactClientSoftDeleteFields } from '@mms/shared';
const draft = { tag: 'VIP' };
const result = hydrateContactRelationshipFields(stripContactClientSoftDeleteFields({ ...draft }) as any);
console.log('result:', result);
