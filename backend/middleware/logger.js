const winston = require('winston');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 10_000_000, maxFiles: 5 }),
    new winston.transports.File({ filename: 'logs/combined.log', maxsize: 10_000_000, maxFiles: 5 }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }));
}

function requestLogger(req, _res, next) {
  logger.info('request', { method: req.method, url: req.originalUrl, ip: req.ip, userId: req.user?.userId });
  next();
}

function errorLogger(err, req, res, _next) {
  logger.error('error', { message: err.message, stack: err.stack, method: req.method, url: req.originalUrl, userId: req.user?.userId });
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { logger, requestLogger, errorLogger };

