import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { clearCalls, listCalls } from './call-log';
import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  const messages: string[] = [];

  beforeEach(() => {
    clearCalls();
    messages.length = 0;
    jest.spyOn(Logger.prototype, 'log').mockImplementation((message: unknown) => {
      messages.push(String(message));
    });
  });

  it('logs that a call was received and records it before the handler runs', () => {
    const middleware = new RequestLoggerMiddleware();
    const finished: Array<() => void> = [];
    const req = {
      method: 'POST',
      originalUrl: '/graphql',
      url: '/graphql',
      ip: '10.0.0.9',
      headers: {},
      body: { operationName: 'Dashboard', query: 'query Dashboard { service { ip } }' },
      socket: { remoteAddress: '10.0.0.9' },
    } as Request;
    const res = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') {
          finished.push(callback);
        }
        return res;
      },
    } as unknown as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(messages.some((line) => line.includes('call received POST /graphql') && line.includes('operation=Dashboard'))).toBe(
      true,
    );
    expect(listCalls()[0]).toMatchObject({
      method: 'POST',
      path: '/graphql',
      ip: '10.0.0.9',
      operation: 'Dashboard',
    });

    finished[0]?.();
    expect(messages.some((line) => line.includes('call completed POST /graphql status=200'))).toBe(true);
  });
});
