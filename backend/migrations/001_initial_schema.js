const { dbRun, dbGet } = require('../config/database');

const up = async () => {
    console.log('Running migration: 001_initial_schema.js (UP)');
    
    await dbRun(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        email TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active INTEGER DEFAULT 1
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        description TEXT
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        price REAL,
        stock INTEGER,
        description TEXT,
        image_url TEXT,
        category_id INTEGER,
        barcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_amount REAL,
        discount REAL DEFAULT 0,
        notes TEXT,
        status TEXT DEFAULT 'completed',
        sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        unit_price REAL,
        total_price REAL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT,
        entity TEXT,
        entity_id INTEGER,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // Add missing fields to existing tables if needed (SQLite ALTER TABLE constraints apply)
    // Normally we'd use a more robust migration tool, but for manual migration we handle it if needed.
};

const down = async () => {
    console.log('Running migration: 001_initial_schema.js (DOWN)');
    await dbRun('DROP TABLE IF EXISTS activity_logs');
    await dbRun('DROP TABLE IF EXISTS sale_items');
    await dbRun('DROP TABLE IF EXISTS sales');
    await dbRun('DROP TABLE IF EXISTS products');
    await dbRun('DROP TABLE IF EXISTS categories');
    await dbRun('DROP TABLE IF EXISTS users');
};

module.exports = { up, down };
