/**
 * Type-safe @ts-rest/react-query client bound to the shared rootContract.
 * All requests flow through the existing `apiFetch` transport — preserving
 * CSRF headers, auth-refresh, request-ID, and timeout behaviour.
 */
import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { initClient } from '@ts-rest/core';
import { rootContract } from '@mms/shared';
import { apiFetch, resolveApiUrl } from '@/lib/apiClient';

type TsrFetcherArgs = {
  path: string;
  method: string;
  body?: unknown;
  rawBody?: unknown;
  headers: Record<string, string>;
  route: unknown;
  signal?: AbortSignal | null;
};

async function tsrApiFetcher(args: TsrFetcherArgs): Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}> {
  const { path, method, body, rawBody, headers } = args;
  const url = resolveApiUrl(path);

  const requestBody: BodyInit | undefined =
    rawBody instanceof FormData
      ? rawBody
      : typeof body === 'string'
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined;

  const res = await apiFetch(url, {
    method,
    body: requestBody,
    headers: headers as HeadersInit,
    signal: args.signal,
  });

  let parsed: unknown;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    parsed = await res.json().catch(() => null);
  } else {
    parsed = await res.text().catch(() => '');
  }

  return { status: res.status, body: parsed, headers: res.headers };
}

export const tsrClient = initTsrReactQuery(rootContract, {
  baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
  api: tsrApiFetcher,
});

 
export const apiContract = initClient(rootContract, {
  baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
  api: tsrApiFetcher,
}) as any; // ts-rest initClient union discrimination limit — callers use direct-call pattern
