import { CallRecord, clearCalls, listCalls, readClientIp, readOperation, recordCall } from './call-log';

describe('call log', () => {
  beforeEach(() => {
    clearCalls();
  });

  it('records a call at the front of the list', () => {
    recordCall({
      method: 'POST',
      path: '/graphql',
      ip: '203.0.113.9',
      operation: 'Dashboard',
      receivedAt: '2026-11-22T07:00:00.000Z',
    });

    expect(listCalls()).toEqual([
      {
        id: expect.any(String),
        method: 'POST',
        path: '/graphql',
        ip: '203.0.113.9',
        operation: 'Dashboard',
        receivedAt: '2026-11-22T07:00:00.000Z',
      },
    ]);
  });

  it('keeps only the newest 25 calls', () => {
    for (let index = 0; index < 30; index += 1) {
      recordCall({
        method: 'GET',
        path: `/health?n=${index}`,
        ip: '127.0.0.1',
        operation: null,
      });
    }

    const calls = listCalls();
    expect(calls).toHaveLength(25);
    expect(calls[0]?.path).toBe('/health?n=29');
    expect(calls[24]?.path).toBe('/health?n=5');
  });

  it('returns copies so callers cannot change the stored log', () => {
    recordCall({ method: 'GET', path: '/health', ip: '127.0.0.1', operation: null });
    const [first] = listCalls();
    first.path = '/changed';
    expect(listCalls()[0]?.path).toBe('/health');
  });

  it('prefers the GraphQL operation name', () => {
    expect(readOperation({ operationName: ' Dashboard ', query: 'query Other { service { ip } }' })).toBe(
      'Dashboard',
    );
  });

  it('reads a named operation from the query text', () => {
    expect(readOperation({ query: '\n query Dashboard {\n service { ip }\n }' })).toBe('Dashboard');
  });

  it('keeps a short preview for an anonymous query', () => {
    expect(readOperation({ query: '{ service { ip } }' })).toBe('{ service { ip } }');
  });

  it('returns null when the body has no query', () => {
    expect(readOperation(undefined)).toBeNull();
    expect(readOperation({})).toBeNull();
  });

  it('reads the first forwarded address', () => {
    expect(
      readClientIp({
        ip: '10.0.0.1',
        headers: { 'x-forwarded-for': '198.51.100.4, 10.0.0.1' },
      }),
    ).toBe('198.51.100.4');
  });

  it('falls back to the socket address', () => {
    expect(readClientIp({ headers: {}, socket: { remoteAddress: '127.0.0.1' } })).toBe('127.0.0.1');
    expect(readClientIp({})).toBe('unknown');
  });
});

describe('CallRecord shape', () => {
  it('stores the fields the GraphQL type exposes', () => {
    const record: CallRecord = {
      id: '1',
      method: 'GET',
      path: '/health',
      ip: '127.0.0.1',
      operation: null,
      receivedAt: '2026-11-22T07:00:00.000Z',
    };
    expect(record.operation).toBeNull();
  });
});
