import { getRedisClient } from '../../lib/redis.js';
import type { BackgroundJobEventMessage } from '@mms/shared';

export async function publishJobEvent(eventPayload: BackgroundJobEventMessage): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const raw = JSON.stringify(eventPayload);
    await client.publish('mms:job-event', raw);
  } catch (err) {
    console.warn('[Worker PubSub] Failed to publish job event to Redis:', err);
  }
}
