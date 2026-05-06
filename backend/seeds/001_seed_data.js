const bcrypt = require('bcryptjs');
const { dbRun, dbGet } = require('../config/database');

const runSeed = async () => {
    console.log('Running seeds: 001_seed_data.js');
    
    // Seed Users
    const defaultUsers = ['batuhan', 'baris', 'gokhan'];
    const defaultPassword = 'veor';
    const hash = bcrypt.hashSync(defaultPassword, 10);

    for (const user of defaultUsers) {
        const row = await dbGet(`SELECT id FROM users WHERE username = ?`, [user]);
        if (!row) {
            await dbRun(`INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)`, [user, hash, 'admin', `${user}@veorcollection.com`]);
            console.log(`Seeded user: ${user}`);
        }
    }

    // Seed Categories
    const categories = ['Classic', 'Night', 'Fresh'];
    for (const cat of categories) {
        const row = await dbGet(`SELECT id FROM categories WHERE name = ?`, [cat]);
        if (!row) {
            await dbRun(`INSERT INTO categories (name, description) VALUES (?, ?)`, [cat, `${cat} Fragrances`]);
        }
    }

    // Seed Products
    const products = [
        { name: 'Veor Classic 50ml', price: 450.00, stock: 100, category: 'Classic', desc: 'A timeless classic fragrance.' },
        { name: 'Veor Night 100ml', price: 750.00, stock: 50, category: 'Night', desc: 'Perfect for elegant evenings.' },
        { name: 'Veor Fresh 50ml', price: 400.00, stock: 120, category: 'Fresh', desc: 'A refreshing daytime scent.' }
    ];

    for (const prod of products) {
        const row = await dbGet(`SELECT id FROM products WHERE name = ?`, [prod.name]);
        if (!row) {
            const catRow = await dbGet(`SELECT id FROM categories WHERE name = ?`, [prod.category]);
            if (catRow) {
                await dbRun(`INSERT INTO products (name, price, stock, category_id, description) VALUES (?, ?, ?, ?, ?)`, 
                    [prod.name, prod.price, prod.stock, catRow.id, prod.desc]);
            }
        }
    }
    
    console.log('Seeding completed.');
};

module.exports = { runSeed };
