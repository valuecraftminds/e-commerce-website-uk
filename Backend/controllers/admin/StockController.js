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
  },

  // Get main stock summary
  async getMainStockSummary(req, res) {
    const company_code = req.params.company_code || req.query.company_code || req.body.company_code;
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }
    try {
      const sql = `SELECT stock_summary_id, style_number, sku, stock_qty, updated_at FROM main_stock_summary WHERE company_code = ?`;
      db.query(sql, [company_code], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        return res.json({ success: true, data: results });
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // get issued stock data
  async getIssuedStock(req, res) {
    const company_code = req.params.company_code || req.query.company_code || req.body.company_code;
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }
    try {
      const sql = `SELECT id, style_number, sku, batch_number, lot_no, issuing_qty FROM stock_issuing WHERE company_code = ?`;

      db.query(sql, [company_code], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        return res.json({ success: true, data: results });
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // get GRN stock
  async getGrnStock(req, res) {
    const company_code = req.params.company_code || req.query.company_code || req.body.company_code;
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }
    try {
      const sql = `SELECT id, style_number, sku, batch_number, lot_no, stock_qty, created_at FROM stock_received WHERE company_code = ?`;

      db.query(sql, [company_code], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        return res.json({ success: true, data: results });
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
}
module.exports = StockController;
