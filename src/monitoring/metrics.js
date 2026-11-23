const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'react_cicd_bg_',
});

const requestsTotal = new client.Counter({
  name: 'react_cicd_bg_http_requests_total',
  help: 'Total HTTP requests handled by this service',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const requestDuration = new client.Histogram({
  name: 'react_cicd_bg_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

module.exports = {
  register,
  requestsTotal,
  requestDuration,
};
