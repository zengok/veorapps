const express = require('express');
const router = express.Router();
const db = require('../database');

// Tüm ürünleri getir
router.get('/', (req, res) => {
    db.all(`SELECT * FROM products ORDER BY name ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Stok güncelleme
router.put('/:id/stock', (req, res) => {
    const { stock } = req.body;
    db.run(`UPDATE products SET stock = ? WHERE id = ?`, [stock, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Stok güncellendi', changes: this.changes });
    });
});

module.exports = router;
