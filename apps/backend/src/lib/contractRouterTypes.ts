import type { FastifyRequest } from 'fastify';
import type { User } from '@mms/shared';
import type { z } from 'zod';

/**
 * Typed request args for a ts-rest contract route handler.
 *
 * ts-rest's `ServerInferRequest` normally infers these from the contract, but
 * the large per-domain contracts (e.g. `financeContract`) exceed TS's
 * union-instantiation depth limit, so both `s.router(contract, ...)` and
 * `ServerInferRequest<...>` degrade the handler args to `any`/never.
 *
 * Extracting the request types via `z.infer` on each route's schema properties
 * avoids that depth blowup and restores full request-side type safety
 * (params / query / body) without restructuring the contracts.
 */
export type ContractRouteArgs<T> = {
  params: T extends { params: infer P } ? z.infer<P> : never;
  query: T extends { query: infer Q } ? z.infer<Q> : never;
  body: T extends { body: infer B } ? z.infer<B> : never;
  headers: T extends { headers: infer H } ? z.infer<H> : never;
  request: FastifyRequest & { user?: User; tenant?: { id: string } };
};

/**
 * Extracts the discriminated response union `{ status, body }` for a contract route.
 * Evaluated per-endpoint to avoid TS union-depth limits on monolithic contracts.
 */
export type ContractRouteResponse<T> = T extends { responses: infer R }
  ? {
      [K in keyof R]: {
        status: K extends `${infer N extends number}` ? N : K extends number ? K : never;
        body: R[K] extends z.ZodTypeAny ? z.infer<R[K]> : unknown;
      };
    }[keyof R]
  : { status: number; body: unknown };

/**
 * Type-safe contract route handler definition enforcing strictly typed request & response.
 */
export type ContractRouteHandler<T> = (
  args: ContractRouteArgs<T>,
) => Promise<ContractRouteResponse<T>>;

