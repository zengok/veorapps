import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { sequelize } from '../models';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Sale } from '../models/Sale';

async function migrate() {
  console.log('Starting migration from SQLite to PostgreSQL...');

  // Connect to SQLite
  const dbPath = path.resolve(__dirname, '../veor.db');
  const sqliteDb = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log('Connected to SQLite.');

  // Connect to Postgres
  await sequelize.authenticate();
  console.log('Connected to PostgreSQL.');

  // Ensure tables exist
  await sequelize.sync({ force: false });

  try {
    // Migrate Users
    console.log('Migrating users...');
    const users = await sqliteDb.all('SELECT * FROM users');
    for (const u of users) {
      await User.findOrCreate({
        where: { id: u.id },
        defaults: {
          username: u.username,
          password: u.password,
          email: u.email || `${u.username}@example.com`,
          role: u.role || 'user',
        },
      });
    }

    // Migrate Categories
    console.log('Migrating categories...');
    const categories = await sqliteDb.all('SELECT * FROM categories');
    for (const c of categories) {
      await Category.findOrCreate({
        where: { id: c.id },
        defaults: {
          name: c.name,
          description: c.description,
        },
      });
    }

    // Migrate Products
    console.log('Migrating products...');
    const products = await sqliteDb.all('SELECT * FROM products');
    for (const p of products) {
      await Product.findOrCreate({
        where: { id: p.id },
        defaults: {
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          categoryId: p.category_id,
          imageUrl: p.image_url,
          sku: p.barcode || `SKU-${p.id}`,
        },
      });
    }

    // Migrate Sales and Sale Items to single Sale structure if possible,
    // Note: The new structure groups them, but we do a simple map here.
    console.log('Migrating sales...');
    const saleItems = await sqliteDb.all(`
      SELECT si.*, s.user_id, s.sale_date, s.status
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
    `);

    for (const si of saleItems) {
      await Sale.create({
        productId: si.product_id,
        userId: si.user_id,
        quantity: si.quantity,
        totalPrice: si.total_price,
        date: new Date(si.sale_date),
        status: si.status || 'completed',
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sqliteDb.close();
    await sequelize.close();
  }
}

migrate();
