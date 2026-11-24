
import { Request, Response, NextFunction } from 'express';
import {
  requestsTotal,
  requestDuration,
} from './metrics';

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    if (req.path === '/metrics') return;

    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    const route =
      req.route?.path
        ? `${req.baseUrl}${req.route.path}`
        : 'unmatched';

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
