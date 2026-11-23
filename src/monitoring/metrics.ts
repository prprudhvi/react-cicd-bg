import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({
  register,
  prefix: 'react_cicd_bg_',
});

const labels = ['method', 'route', 'status_code'] as const;

export const requestsTotal = new Counter({
  name: 'react_cicd_bg_http_requests_total',
  help: 'Total HTTP requests handled by this service',
  labelNames: labels,
  registers: [register],
});

export const requestDuration = new Histogram({
  name: 'react_cicd_bg_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: labels,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});
