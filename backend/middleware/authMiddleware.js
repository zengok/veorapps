const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { AppError } = require('./errorHandler');
const { User } = require('../models');

// In-memory token blacklist (production'da Redis kullanılmalı)
const tokenBlacklist = new Set();

const authMiddleware = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Lütfen giriş yapınız', 401));
        }

        // Check if token is blacklisted (logged out tokens)
        if (tokenBlacklist.has(token)) {
            return next(new AppError('Bu token geçersiz kılınmış, lütfen tekrar giriş yapın', 401));
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Check if user still exists in DB
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'username', 'role', 'email', 'failedLoginAttempts', 'lockUntil']
        });
        if (!user) {
            return next(new AppError('Bu tokena sahip kullanıcı artık mevcut değil', 401));
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
            return next(new AppError(`Hesabınız kilitli. ${minutesLeft} dakika sonra tekrar deneyin.`, 423));
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token süresi dolmuş, lütfen tekrar giriş yapın', 401));
        }
        return next(new AppError('Geçersiz token', 401));
    }
};

const addToBlacklist = (token) => {
    tokenBlacklist.add(token);
};

module.exports = authMiddleware;
module.exports.addToBlacklist = addToBlacklist;
