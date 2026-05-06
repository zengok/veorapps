const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({ attributes: ['id', 'username', 'role', 'email', 'createdAt'] });
        res.json({ status: 'success', data: users });
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const { username, password, role, email } = req.body;
        
        const exists = await User.findOne({ 
            where: { [Op.or]: [{ username }, { email }] }
        });
        if (exists) return next(new AppError('Bu kullanıcı adı veya e-posta zaten kullanımda', 400));

        const hash = await bcrypt.hash(password, 10);
        await User.create({ username, password: hash, role: role || 'user', email });
        
        res.status(201).json({ status: 'success', message: 'Kullanıcı oluşturuldu' });
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { role, email } = req.body;
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) return next(new AppError('Kullanıcı bulunamadı', 404));

        await user.update({ role, email });
        
        res.json({ status: 'success', message: 'Kullanıcı güncellendi' });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return next(new AppError('Kullanıcı bulunamadı', 404));

        await user.destroy();
        res.json({ status: 'success', message: 'Kullanıcı silindi' });
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'role', 'email', 'createdAt'] });
        res.json({ status: 'success', data: user });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return next(new AppError('Kullanıcı bulunamadı', 404));

        await user.update({ email });
        res.json({ status: 'success', message: 'Profil güncellendi' });
    } catch (error) {
        next(error);
    }
};
