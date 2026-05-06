const { AppError } = require('./errorHandler');

const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Bu işlemi yapmaya yetkiniz yok', 403));
        }
        next();
    };
};

module.exports = roleMiddleware;
