import { NextFunction, Request, Response } from 'express';
import { requestDuration, requestsTotal } from './metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route && typeof req.route.path === 'string' ? req.route.path : 'unknown';
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    requestsTotal.inc(labels);
    requestDuration.observe(labels, duration);
  });

  next();
}
