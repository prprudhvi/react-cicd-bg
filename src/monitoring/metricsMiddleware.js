const {
  requestsTotal,
  requestDuration,
} = require('./metrics');

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    const labels = {
      method: req.method,
      route: req.route?.path || 'unknown',
      status_code: String(res.statusCode),
    };

    requestsTotal.inc(labels);
    requestDuration.observe(labels, duration);
  });

  next();
}

module.exports = metricsMiddleware;