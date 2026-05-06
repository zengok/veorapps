const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { dbGet, dbRun } = require('../config/database');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Store refresh tokens in memory (in production, use Redis or database)
const refreshTokens = [];

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return next(new AppError('Kullanıcı adı veya şifre hatalı', 401));
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return next(new AppError('Kullanıcı adı veya şifre hatalı', 401));
        }

        if (!user.is_active) {
            return next(new AppError('Hesabınız dondurulmuş', 403));
        }

        // Update last login
        await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        await dbRun('INSERT INTO activity_logs (user_id, action, entity, details) VALUES (?, ?, ?, ?)', 
            [user.id, 'LOGIN', 'auth', 'User logged in']);

        const payload = { id: user.id, username: user.username, role: user.role };
        const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

        refreshTokens.push(refreshToken);

        res.json({
            status: 'success',
            token,
            refreshToken,
            user: { id: user.id, username: user.username, role: user.role, email: user.email }
        });
    } catch (error) {
        next(error);
    }
};

exports.refreshToken = (req, res, next) => {
    const { token } = req.body;
    if (!token) return next(new AppError('Refresh token gerekli', 400));
    if (!refreshTokens.includes(token)) return next(new AppError('Geçersiz refresh token', 403));

    jwt.verify(token, config.jwt.refreshSecret, (err, decoded) => {
        if (err) return next(new AppError('Süresi dolmuş veya geçersiz refresh token', 403));
        
        const payload = { id: decoded.id, username: decoded.username, role: decoded.role };
        const newAccessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        res.json({ status: 'success', token: newAccessToken });
    });
};

exports.logout = (req, res, next) => {
    const { token } = req.body;
    // Remove refresh token
    const index = refreshTokens.indexOf(token);
    if (index > -1) refreshTokens.splice(index, 1);

    res.json({ status: 'success', message: 'Başarıyla çıkış yapıldı' });
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await dbGet('SELECT password FROM users WHERE id = ?', [userId]);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return next(new AppError('Mevcut şifre hatalı', 401));

        const hash = await bcrypt.hash(newPassword, 10);
        await dbRun('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, userId]);

        await dbRun('INSERT INTO activity_logs (user_id, action, entity, details) VALUES (?, ?, ?, ?)', 
            [userId, 'CHANGE_PASSWORD', 'auth', 'Password changed']);

        res.json({ status: 'success', message: 'Şifreniz başarıyla güncellendi' });
    } catch (error) {
        next(error);
    }
};
