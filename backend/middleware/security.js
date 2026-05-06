const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

// 1. Helmet setup (CSP, X-Frame-Options, HSTS, etc.)
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    xssFilter: true, // X-XSS-Protection
    noSniff: true, // X-Content-Type-Options
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny' // X-Frame-Options
    },
    referrerPolicy: {
        policy: 'no-referrer'
    }
});

// 2. Advanced Rate Limiting
const whitelistIPs = ['127.0.0.1', '::1'];

const skipWhitelist = (req) => {
    return whitelistIPs.includes(req.ip);
};

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: skipWhitelist,
    handler: (req, res, next) => {
        res.status(429).json({
            status: 'error',
            message: 'Çok fazla istek yapıldı, lütfen 15 dakika sonra tekrar deneyin.'
        });
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 failed requests per `window` (normally only applied to failures, but for simplicity limiting all login hits here. The actual auth controller will have account lockout.)
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipWhitelist,
    handler: (req, res, next) => {
        res.status(429).json({
            status: 'error',
            message: 'Çok fazla giriş denemesi yapıldı, lütfen 15 dakika sonra tekrar deneyin.'
        });
    }
});

// 3. Input Sanitization
const dataSanitization = [
    mongoSanitize(), // Protect against NoSQL Injection (even if using Postgres, good for removing $ and .)
    xss() // Protect against XSS
];

module.exports = {
    securityHeaders,
    apiLimiter,
    loginLimiter,
    dataSanitization
};
