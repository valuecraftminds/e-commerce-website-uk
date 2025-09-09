const db = require('../../config/database');

const StockController = {
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }
    try {
      // Get total count
      const countSql = `
        SELECT COUNT(*) as total 
        FROM main_stock_summary mss
        WHERE mss.company_code = ?
      `;
      
      // Get paginated data
      const sql = `
        SELECT 
          mss.stock_summary_id, 
          mss.style_number, 
          s.name AS style_name,
          mss.sku, 
          mss.stock_qty, 
          mss.updated_at 
        FROM main_stock_summary mss
        LEFT JOIN styles s ON mss.style_number = s.style_number AND mss.company_code = s.company_code
        WHERE mss.company_code = ?
        ORDER BY mss.updated_at DESC
        LIMIT ? OFFSET ? 
      `;
      
      db.query(countSql, [company_code], (err, countResult) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        
        db.query(sql, [company_code, limit, offset], (err, results) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
          }
          
          return res.json({ 
            success: true, 
            data: results,
            pagination: {
              currentPage: page,
              totalPages: totalPages,
              totalRecords: total,
              limit: limit,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          });
        });
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // get issued stock data
  async getIssuedStock(req, res) {
    const company_code = req.params.company_code || req.query.company_code || req.body.company_code;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }
    try {
      // Get total count
      const countSql = `
        SELECT COUNT(*) as total 
        FROM stock_issuing si 
        WHERE si.company_code = ?
      `;
      
      // Get paginated data
      const sql = `
        SELECT 
          si.id, 
          si.style_number, 
          s.name AS style_name,
          si.sku, 
          si.batch_number, 
          si.lot_no, 
          si.issuing_qty,
          si.issued_at
        FROM stock_issuing si 
        LEFT JOIN styles s ON si.style_number = s.style_number AND si.company_code = s.company_code
        WHERE si.company_code = ?
        ORDER BY si.issued_at DESC
        LIMIT ? OFFSET ?
      `;

      db.query(countSql, [company_code], (err, countResult) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        
        db.query(sql, [company_code, limit, offset], (err, results) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
          }
          
          return res.json({ 
            success: true, 
            data: results,
            pagination: {
              currentPage: page,
              totalPages: totalPages,
              totalRecords: total,
              limit: limit,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          });
        });
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // get GRN stock
  async getGrnStock(req, res) {
    const company_code = req.params.company_code || req.query.company_code || req.body.company_code;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }
    try {
      // Get total count
      const countSql = `
        SELECT COUNT(*) as total 
        FROM stock_received sr
        WHERE sr.company_code = ?
      `;
      
      // Get paginated data
      const sql = `
        SELECT 
          sr.id, 
          gi.grn_id,
          sr.style_number,
          s.name as style_name,
          sr.sku, 
          sr.batch_number, 
          sr.lot_no, 
          sr.stock_qty, 
          sr.created_at,
          gi.location_id,
          l.location_name
        FROM stock_received sr
        LEFT JOIN grn_items gi ON sr.sku = gi.sku AND sr.company_code = gi.company_code
        LEFT JOIN styles s ON sr.style_number = s.style_number AND sr.company_code = s.company_code
        LEFT JOIN locations l ON gi.location_id = l.location_id AND gi.company_code = l.company_code
        WHERE sr.company_code = ?
        ORDER BY sr.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.query(countSql, [company_code], (err, countResult) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        
        db.query(sql, [company_code, limit, offset], (err, results) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
          }
          
          return res.json({ 
            success: true, 
            data: results,
            pagination: {
              currentPage: page,
              totalPages: totalPages,
              totalRecords: total,
              limit: limit,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          });
        });
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
}
module.exports = StockController;
