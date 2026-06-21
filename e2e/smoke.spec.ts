import { test, expect } from '@playwright/test';

test.describe('MMS smoke', () => {
  test('health endpoint responds', async ({ request }) => {
    const res = await request.get(`${process.env.E2E_API_URL ?? 'http://127.0.0.1:3000'}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({ status: 'OK' });
  });
});
