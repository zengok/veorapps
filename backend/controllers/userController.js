const { dbGet, dbRun, dbAll } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await dbAll('SELECT id, username, role, email, phone, last_login, is_active, created_at FROM users');
        res.json({ status: 'success', data: users });
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const { username, password, role, email, phone } = req.body;
        
        const exists = await dbGet('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (exists) return next(new AppError('Bu kullanıcı adı veya e-posta zaten kullanımda', 400));

        const hash = await bcrypt.hash(password, 10);
        await dbRun(`INSERT INTO users (username, password, role, email, phone) VALUES (?, ?, ?, ?, ?)`, 
            [username, hash, role || 'user', email, phone]);
        
        res.status(201).json({ status: 'success', message: 'Kullanıcı oluşturuldu' });
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { role, email, phone, is_active } = req.body;
        const { id } = req.params;

        await dbRun(`UPDATE users SET role=?, email=?, phone=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, 
            [role, email, phone, is_active, id]);
        
        res.json({ status: 'success', message: 'Kullanıcı güncellendi' });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        await dbRun('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
        res.json({ status: 'success', message: 'Kullanıcı silindi (soft delete)' });
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await dbGet('SELECT id, username, role, email, phone, last_login, created_at FROM users WHERE id = ?', [req.user.id]);
        res.json({ status: 'success', data: user });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { email, phone } = req.body;
        await dbRun('UPDATE users SET email=?, phone=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [email, phone, req.user.id]);
        res.json({ status: 'success', message: 'Profil güncellendi' });
    } catch (error) {
        next(error);
    }
};
