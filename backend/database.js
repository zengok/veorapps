const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'veor.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanına bağlanılamadı:', err.message);
    } else {
        console.log('SQLite veritabanına bağlanıldı.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Kullanıcılar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )`);

        // Parfümler/Katalog Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            price REAL,
            stock INTEGER
        )`);

        // Satışlar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            quantity INTEGER,
            total_price REAL,
            sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER,
            FOREIGN KEY (product_id) REFERENCES products (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Varsayılan Yöneticileri Ekleme
        const defaultUsers = ['batuhan', 'baris', 'gokhan'];
        const defaultPassword = 'veor'; // Tüm kullanıcılar için varsayılan şifre

        try {
            const hash = bcrypt.hashSync(defaultPassword, 10);
            defaultUsers.forEach(user => {
                db.get(`SELECT id FROM users WHERE username = ?`, [user], (err, row) => {
                    if (!row) {
                        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [user, hash, 'admin']);
                        console.log(`Kullanıcı oluşturuldu: ${user}`);
                    }
                });
            });
        } catch (err) {
            console.error('Şifre hashleme hatası:', err);
        }

        // Örnek Ürün Ekleme (Test amaçlı)
        db.get(`SELECT count(*) as count FROM products`, (err, row) => {
            if (row && row.count === 0) {
                db.run(`INSERT INTO products (name, price, stock) VALUES ('Veor Classic 50ml', 450.00, 100)`);
                db.run(`INSERT INTO products (name, price, stock) VALUES ('Veor Night 100ml', 750.00, 50)`);
                db.run(`INSERT INTO products (name, price, stock) VALUES ('Veor Fresh 50ml', 400.00, 120)`);
                console.log('Örnek parfümler eklendi.');
            }
        });
    });
}

module.exports = db;
