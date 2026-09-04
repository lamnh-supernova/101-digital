export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

export interface ApiRequestOptions {
  readonly method?: 'GET' | 'POST';
  readonly token?: string;
  readonly body?: unknown;
  readonly searchParams?: Readonly<Record<string, string | number | undefined>>;
}

function buildUrl(path: string, searchParams?: ApiRequestOptions['searchParams']): string {
  const url = new URL(path, apiBaseUrl());

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function extractErrorMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return undefined;
  }

  const message = (body as { message?: unknown }).message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }

  return undefined;
}

/** Calls the SimpleInvoice API directly from the browser with an optional bearer token. */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };

  if (options.token !== undefined) {
    headers.authorization = `Bearer ${options.token}`;
  }

  let body: string | undefined;

  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.searchParams), {
      method: options.method ?? 'GET',
      headers,
      ...(body === undefined ? {} : { body }),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      0,
      undefined,
      'The service is unreachable. Check your connection and try again.',
    );
  }

  const text = await response.text();
  const parsed: unknown = text === '' ? undefined : safeJsonParse(text);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      parsed,
      extractErrorMessage(parsed) ?? 'The request could not be completed.',
    );
  }

  return parsed as T;
}
