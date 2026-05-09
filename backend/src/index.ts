import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import saleRoutes from './routes/sales';
import orderRoutes from './routes/orders';
import dashboardRoutes from './routes/dashboard';
import notificationRoutes from './routes/notifications';
import importRoutes from './routes/import';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/import', importRoutes);

// Global hata yakalayıcı — en sonda olmalı
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Veor Collection API — port ${PORT}`);
});

export default app;
