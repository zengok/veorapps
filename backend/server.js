require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize database
require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const analyticsRoutes = require('./routes/analytics');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');

const app = express();

// Security Middlewares
const corsOptions = {
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(','),
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: 'Bu IP adresinden çok fazla istek yapıldı, lütfen daha sonra tekrar deneyin.'
});
app.use('/api/', apiLimiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.url} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Veor Collection API Çalışıyor');
});

// Unhandled route handler
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `${req.originalUrl} adresi bulunamadı!`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Sunucu ${PORT} portunda çalışıyor (Çevre: ${config.env})`);
});

