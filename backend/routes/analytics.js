const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/summary', (req, res) => {
    // Toplam satılan adet ve Toplam Kazanç
    const totalQuery = `SELECT SUM(quantity) as total_quantity, SUM(total_price) as total_revenue FROM sales`;
    
    // Günlük Satışlar
    const dailyQuery = `SELECT SUM(quantity) as quantity, SUM(total_price) as revenue FROM sales WHERE date(sale_date) = date('now')`;
    
    // Haftalık Satışlar
    const weeklyQuery = `SELECT SUM(quantity) as quantity, SUM(total_price) as revenue FROM sales WHERE date(sale_date) >= date('now', '-7 days')`;
    
    // Aylık Satışlar
    const monthlyQuery = `SELECT SUM(quantity) as quantity, SUM(total_price) as revenue FROM sales WHERE date(sale_date) >= date('now', 'start of month')`;

    db.get(totalQuery, [], (err, totalRow) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.get(dailyQuery, [], (err, dailyRow) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.get(weeklyQuery, [], (err, weeklyRow) => {
                if (err) return res.status(500).json({ error: err.message });
                
                db.get(monthlyQuery, [], (err, monthlyRow) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    res.json({
                        total: {
                            quantity: totalRow.total_quantity || 0,
                            revenue: totalRow.total_revenue || 0
                        },
                        daily: {
                            quantity: dailyRow.quantity || 0,
                            revenue: dailyRow.revenue || 0
                        },
                        weekly: {
                            quantity: weeklyRow.quantity || 0,
                            revenue: weeklyRow.revenue || 0
                        },
                        monthly: {
                            quantity: monthlyRow.quantity || 0,
                            revenue: monthlyRow.revenue || 0
                        }
                    });
                });
            });
        });
    });
});

module.exports = router;
