const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const db = require('./database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('Veor Collection API Çalışıyor');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
