import { initServer } from '@ts-rest/fastify';
import { z } from 'zod';
import { initContract } from '@ts-rest/core';

const c = initContract();
const contract = c.router({
  list: { method: 'GET', path: '/list', responses: { 200: z.string() } },
  get: { method: 'GET', path: '/:id', responses: { 200: z.string() } },
});

const s = initServer();

// @ts-expect-error
const router = s.router(contract, {
  list: async ({ query }) => {
    return { status: 200, body: 'hello' };
  }
});
