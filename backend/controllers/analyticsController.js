const { sequelize, Sale, Product, User } = require('../models');
const { QueryTypes, Op } = require('sequelize');

exports.getDashboard = async (req, res, next) => {
    try {
        const [totalSales, totalRevenue, totalProducts, lowStockCount] = await Promise.all([
            Sale.count({ where: { status: 'completed' } }),
            Sale.sum('totalPrice', { where: { status: 'completed' } }),
            Product.count(),
            Product.count({ where: { stock: { [Op.lt]: 10 } } })
        ]);

        res.json({
            status: 'success',
            data: {
                totalSales,
                totalRevenue: totalRevenue || 0,
                totalProducts,
                lowStockCount
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getSalesTrend = async (req, res, next) => {
    try {
        // We use raw query for date grouping as it's cleaner in Postgres
        const trend = await sequelize.query(`
            SELECT DATE("date") as date, SUM("totalPrice") as revenue, COUNT(*) as sales_count
            FROM sales 
            WHERE status = 'completed' 
            GROUP BY DATE("date") 
            ORDER BY DATE("date") DESC 
            LIMIT 30
        `, { type: QueryTypes.SELECT });

        res.json({ status: 'success', data: trend });
    } catch (error) {
        next(error);
    }
};

exports.getTopProducts = async (req, res, next) => {
    try {
        const topProducts = await sequelize.query(`
            SELECT p.name, SUM(s.quantity) as total_sold, SUM(s."totalPrice") as total_revenue
            FROM sales s
            JOIN products p ON s."productId" = p.id
            WHERE s.status = 'completed'
            GROUP BY p.id, p.name
            ORDER BY total_sold DESC
            LIMIT 10
        `, { type: QueryTypes.SELECT });
        
        res.json({ status: 'success', data: topProducts });
    } catch (error) {
        next(error);
    }
};

exports.getTopSellers = async (req, res, next) => {
    try {
        const topSellers = await sequelize.query(`
            SELECT u.username, COUNT(s.id) as sales_count, SUM(s."totalPrice") as total_revenue
            FROM sales s
            JOIN users u ON s."userId" = u.id
            WHERE s.status = 'completed'
            GROUP BY u.id, u.username
            ORDER BY total_revenue DESC
            LIMIT 10
        `, { type: QueryTypes.SELECT });
        
        res.json({ status: 'success', data: topSellers });
    } catch (error) {
        next(error);
    }
};
