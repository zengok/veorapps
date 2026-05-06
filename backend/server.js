require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { securityHeaders, apiLimiter, loginLimiter, dataSanitization } = require('./middleware/security');

// Initialize database (SQLite legacy config kept for reference)
require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const analyticsRoutes = require('./routes/analytics');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const mediaRoutes = require('./routes/media');

const app = express();

// ── 1. SECURITY HEADERS (Helmet) ────────────────────────────────────────────
app.use(securityHeaders);

// ── 2. CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = config.corsOrigin === '*'
    ? '*'
    : config.corsOrigin.split(',').map(o => o.trim());

const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ── 3. HTTPS REDIRECT (production only) ────────────────────────────────────
if (config.env === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// ── 4. BODY PARSING ─────────────────────────────────────────────────────────
app.use(bodyParser.json({ limit: '10kb' }));   // Limit body size to prevent large payload attacks
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

// ── 5. INPUT SANITIZATION (XSS + NoSQL Injection) ──────────────────────────
dataSanitization.forEach(fn => app.use(fn));

// ── 6. GLOBAL RATE LIMITING ─────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── 7. REQUEST LOGGING ──────────────────────────────────────────────────────
app.use((req, res, next) => {
    // Avoid logging sensitive paths
    const sanitizedUrl = req.url.replace(/\/auth\/.*/, '/auth/[REDACTED]');
    logger.info(`[${req.method}] ${sanitizedUrl} - IP: ${req.ip}`);
    next();
});

// ── 8. ROUTES ───────────────────────────────────────────────────────────────
// Login endpoint gets its own strict rate limiter
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);

// Static file serving (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Veor Collection API Çalışıyor', env: config.env });
});

// ── 9. 404 HANDLER ──────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `${req.originalUrl} adresi bulunamadı!`
    });
});

// ── 10. GLOBAL ERROR HANDLER ─────────────────────────────────────────────────
app.use(errorHandler);

// ── SERVER START ─────────────────────────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Sunucu ${PORT} portunda çalışıyor (Çevre: ${config.env})`);
});
