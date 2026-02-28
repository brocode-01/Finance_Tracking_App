const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many auth attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Limit: 100/hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { message: 'Too many requests. Limit: 50/hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, transactionLimiter, analyticsLimiter };
