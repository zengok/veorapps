const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');
const { addToBlacklist } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { User } = require('../models');

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Password policy regex
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])[A-Za-z\d@$!%*?&._\-#]{8,}$/;

// In-memory refresh token store – replace with Redis in production
const refreshTokenStore = new Set();

// ── HELPERS ────────────────────────────────────────────────────────────────
const signAccessToken = (payload) =>
    jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const signRefreshToken = (payload) =>
    jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

// ── LOGIN ──────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return next(new AppError('Kullanıcı adı ve şifre zorunludur', 400));
        }

        const user = await User.findOne({ where: { username } });

        // Account lockout check (before password comparison to prevent timing attack)
        if (user && user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
            return next(new AppError(`Hesabınız kilitli. ${minutesLeft} dakika sonra tekrar deneyin.`, 423));
        }

        // User not found or wrong password – deliberate identical error message
        const isMatch = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !isMatch) {
            if (user) {
                const newFailCount = (user.failedLoginAttempts || 0) + 1;
                const updates = { failedLoginAttempts: newFailCount };

                if (newFailCount >= MAX_FAILED_ATTEMPTS) {
                    updates.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                    logger.warn(`Hesap kilitlendi: ${username} (${newFailCount} başarısız deneme)`);
                }

                await user.update(updates);
            }
            return next(new AppError('Kullanıcı adı veya şifre hatalı', 401));
        }

        // Successful login – reset counters
        await user.update({ failedLoginAttempts: 0, lockUntil: null });

        const payload = { id: user.id, username: user.username, role: user.role };
        const token = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        refreshTokenStore.add(refreshToken);

        logger.info(`Kullanıcı giriş yaptı: ${username}`);

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

// ── REFRESH TOKEN ──────────────────────────────────────────────────────────
exports.refreshToken = (req, res, next) => {
    const { token } = req.body;
    if (!token) return next(new AppError('Refresh token gerekli', 400));
    if (!refreshTokenStore.has(token)) return next(new AppError('Geçersiz refresh token', 403));

    jwt.verify(token, config.jwt.refreshSecret, (err, decoded) => {
        if (err) {
            refreshTokenStore.delete(token); // Remove expired token
            return next(new AppError('Süresi dolmuş veya geçersiz refresh token', 403));
        }

        // Refresh token rotation – invalidate old, issue new
        refreshTokenStore.delete(token);

        const payload = { id: decoded.id, username: decoded.username, role: decoded.role };
        const newAccessToken = signAccessToken(payload);
        const newRefreshToken = signRefreshToken(payload);

        refreshTokenStore.add(newRefreshToken);

        res.json({ status: 'success', token: newAccessToken, refreshToken: newRefreshToken });
    });
};

// ── LOGOUT ─────────────────────────────────────────────────────────────────
exports.logout = (req, res, next) => {
    const { token } = req.body;

    if (token) refreshTokenStore.delete(token);

    // Blacklist the current access token if available via auth middleware
    if (req.token) {
        addToBlacklist(req.token);
    }

    res.json({ status: 'success', message: 'Başarıyla çıkış yapıldı' });
};

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Password policy enforcement
        if (!PASSWORD_POLICY.test(newPassword)) {
            return next(new AppError(
                'Şifre en az 8 karakter olmalı ve büyük harf, küçük harf, rakam ile özel karakter (@$!%*?&._-#) içermelidir.',
                400
            ));
        }

        const user = await User.findByPk(userId);
        if (!user) return next(new AppError('Kullanıcı bulunamadı', 404));

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return next(new AppError('Mevcut şifre hatalı', 401));

        const hash = await bcrypt.hash(newPassword, 12);
        await user.update({ password: hash });

        // Blacklist current access token to force re-login
        if (req.token) addToBlacklist(req.token);

        res.json({ status: 'success', message: 'Şifreniz başarıyla güncellendi. Lütfen tekrar giriş yapın.' });
    } catch (error) {
        next(error);
    }
};
