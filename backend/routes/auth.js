const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET_KEY = 'veor_gizli_anahtari_degistirilmeli';

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Doğrulama hatası' });
            if (!isMatch) return res.status(401).json({ error: 'Yanlış şifre' });

            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
        });
    });
});

module.exports = router;
