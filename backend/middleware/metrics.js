const client = require('prom-client');

client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.route?.path || req.path });
  res.on('finish', () => {
    const labels = { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    end({ status_code: res.statusCode });
  });
  next();
}

function metricsRoute(_req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
}

module.exports = { metricsMiddleware, metricsRoute };

