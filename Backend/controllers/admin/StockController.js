  const db = require('../../config/database');

const StockController = {
  // GET /api/admin/stock/get-stock-summary?company_code=...&style_number=...&sku=...
  async getStockSummary(req, res) {
    const { company_code, style_number, sku } = req.query;
    if (!company_code || !style_number || !sku) {
      return res.status(400).json({ success: false, message: 'company_code, style_number, and sku are required' });
    }
    try {
      const sql = `SELECT stock_qty FROM main_stock_summary WHERE company_code = ? AND style_number = ? AND sku = ? LIMIT 1`;
      db.query(sql, [company_code, style_number, sku], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        if (results.length > 0) {
          return res.json({ success: true, stock_qty: results[0].stock_qty });
        } else {
          return res.json({ success: true, stock_qty: 0 });
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
};

module.exports = StockController;
