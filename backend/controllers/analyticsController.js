const { dbGet, dbAll } = require('../config/database');

exports.getDashboard = async (req, res, next) => {
    try {
        const [totalSales, totalRevenue, totalProducts, lowStockProducts] = await Promise.all([
            dbGet("SELECT COUNT(*) as count FROM sales WHERE status = 'completed'"),
            dbGet("SELECT SUM(total_amount) as total FROM sales WHERE status = 'completed'"),
            dbGet("SELECT COUNT(*) as count FROM products WHERE is_active = 1"),
            dbGet("SELECT COUNT(*) as count FROM products WHERE stock < 10 AND is_active = 1")
        ]);

        res.json({
            status: 'success',
            data: {
                totalSales: totalSales.count,
                totalRevenue: totalRevenue.total || 0,
                totalProducts: totalProducts.count,
                lowStockCount: lowStockProducts.count
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getSalesTrend = async (req, res, next) => {
    try {
        const trend = await dbAll(`
            SELECT date(sale_date) as date, SUM(total_amount) as revenue, COUNT(*) as sales_count
            FROM sales 
            WHERE status = 'completed' 
            GROUP BY date(sale_date) 
            ORDER BY date(sale_date) DESC 
            LIMIT 30
        `);
        res.json({ status: 'success', data: trend });
    } catch (error) {
        next(error);
    }
};

exports.getTopProducts = async (req, res, next) => {
    try {
        const topProducts = await dbAll(`
            SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.total_price) as total_revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status = 'completed'
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 10
        `);
        res.json({ status: 'success', data: topProducts });
    } catch (error) {
        next(error);
    }
};

exports.getTopSellers = async (req, res, next) => {
    try {
        const topSellers = await dbAll(`
            SELECT u.username, COUNT(s.id) as sales_count, SUM(s.total_amount) as total_revenue
            FROM sales s
            JOIN users u ON s.user_id = u.id
            WHERE s.status = 'completed'
            GROUP BY u.id
            ORDER BY total_revenue DESC
            LIMIT 10
        `);
        res.json({ status: 'success', data: topSellers });
    } catch (error) {
        next(error);
    }
};
