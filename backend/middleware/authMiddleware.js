const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { AppError } = require('./errorHandler');
const { dbGet } = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Lütfen giriş yapınız', 401));
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Check if user still exists
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (!user) {
            return next(new AppError('Bu tokena sahip kullanıcı artık mevcut değil', 401));
        }

        // Check if active
        if (!user.is_active) {
            return next(new AppError('Hesabınız dondurulmuş', 401));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new AppError('Geçersiz veya süresi dolmuş token', 401));
    }
};

module.exports = authMiddleware;
