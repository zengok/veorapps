const express = require('express');
const router = express.Router();
const db = require('../database');

// Yeni satış ekle
router.post('/', (req, res) => {
    const { product_id, quantity, user_id } = req.body;

    // Önce ürünün fiyatını ve güncel stoğunu bul
    db.get(`SELECT price, stock FROM products WHERE id = ?`, [product_id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Yetersiz stok' });
        }

        const total_price = product.price * quantity;

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Satışı kaydet
            db.run(`INSERT INTO sales (product_id, quantity, total_price, user_id) VALUES (?, ?, ?, ?)`, 
                [product_id, quantity, total_price, user_id], 
                function(err) {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: err.message });
                    }

                    // Stoğu güncelle
                    db.run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [quantity, product_id], (err) => {
                        if (err) {
                            db.run("ROLLBACK");
                            return res.status(500).json({ error: err.message });
                        }
                        
                        db.run("COMMIT");
                        res.status(201).json({ message: 'Satış başarıyla kaydedildi' });
                    });
                }
            );
        });
    });
});

// Son 5 satışı getir
router.get('/recent', (req, res) => {
    const query = `
        SELECT s.id, p.name as product_name, s.quantity, s.total_price, s.sale_date, u.username
        FROM sales s
        JOIN products p ON s.product_id = p.id
        JOIN users u ON s.user_id = u.id
        ORDER BY s.sale_date DESC
        LIMIT 5
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
