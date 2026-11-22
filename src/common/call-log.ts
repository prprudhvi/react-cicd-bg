export interface CallRecord {
  id: string;
  method: string;
  path: string;
  ip: string;
  operation: string | null;
  receivedAt: string;
}

const MAX_CALLS = 25;
const calls: CallRecord[] = [];
let sequence = 0;

export function recordCall(
  input: Omit<CallRecord, 'id' | 'receivedAt'> & { receivedAt?: string },
): CallRecord {
  const entry: CallRecord = {
    id: String(++sequence),
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    method: input.method,
    path: input.path,
    ip: input.ip,
    operation: input.operation,
  };
  calls.unshift(entry);
  if (calls.length > MAX_CALLS) {
    calls.length = MAX_CALLS;
  }
  return entry;
}

export function listCalls(): CallRecord[] {
  return calls.map((call) => ({ ...call }));
}

export function clearCalls(): void {
  calls.length = 0;
}

export function readOperation(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as { operationName?: unknown; query?: unknown };
  if (typeof record.operationName === 'string' && record.operationName.trim()) {
    return record.operationName.trim();
  }
  if (typeof record.query !== 'string') {
    return null;
  }
  const compact = record.query.replace(/\s+/g, ' ').trim();
  const named = compact.match(/^(query|mutation|subscription)\s+([_A-Za-z][\w]*)/);
  if (named) {
    return named[2];
  }
  return compact.slice(0, 80) || null;
}

export function readClientIp(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0]?.trim() || 'unknown';
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
