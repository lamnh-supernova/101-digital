import { ApiError, apiRequest } from './api-client';

describe('apiRequest', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends a bearer token, JSON body, and builds query params on the configured base URL', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const result = await apiRequest<{ ok: boolean }>('/invoices', {
      method: 'POST',
      token: 'TEST_ONLY_TOKEN',
      body: { invoiceNumber: 'INV-1' },
      searchParams: { page: 1, keyword: '' },
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/invoices');
    expect(url).toContain('page=1');
    expect(url).not.toContain('keyword');
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe('Bearer TEST_ONLY_TOKEN');
    expect(headers.get('content-type')).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ invoiceNumber: 'INV-1' }));
  });

  it('omits the authorization header when no token is provided', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));

    await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@example.test' } });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).has('authorization')).toBe(false);
  });

  it('throws an ApiError carrying the status and server message on a non-2xx response', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 409, message: 'Invoice number already exists' }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(apiRequest('/invoices', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 409,
      message: 'Invoice number already exists',
    });
  });

  it('falls back to the first message when the server returns a validation array', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ statusCode: 400, message: ['dueDate must be on or after invoiceDate'] }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
    );

    await expect(apiRequest('/invoices', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 400,
      message: 'dueDate must be on or after invoiceDate',
    });
  });

  it('reports an unreachable service as a distinguishable network ApiError', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await apiRequest('/invoices').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });
});
