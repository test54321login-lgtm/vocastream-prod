/**
 * Rate Limiting Middleware
 * Protects authentication endpoints from brute force attacks
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints
 * Limits to 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { 
    error: 'Too many login attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts, please try again later',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Rate limiter for general API endpoints
 * Limits to 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { 
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for TTS endpoints
 * Limits to 10 requests per minute per user to prevent abuse
 */
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { 
    error: 'Too many TTS requests, please try again later',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many TTS requests, please try again later',
      retryAfter: '1 minute'
    });
  },
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  ttsLimiter
};
