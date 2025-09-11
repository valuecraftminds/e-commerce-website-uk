const db = require('../../config/database');

const StockController = {
  searchStock: async (req, res) => {
    const { company_code, style_number, style_name, type } = req.query || req.body || req.params;

    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }

    try {
      let sql = '';
      let params = [company_code];
      let orderBy = '';
      let limit = parseInt(req.query.limit) || 100;
      let page = parseInt(req.query.page) || 1;
      let offset = (page - 1) * limit;

      // Helper to build search condition
      function buildSearchCondition(tableAlias) {
        if (style_number && style_name) {
          // Use OR if both provided
          return {
            clause: ` AND ( ${tableAlias}.style_number LIKE ? OR s.name LIKE ? )`,
            values: [`%${style_number}%`, `%${style_name}%`]
          };
        } else if (style_number) {
          return {
            clause: ` AND ${tableAlias}.style_number LIKE ?`,
            values: [`%${style_number}%`]
          };
        } else if (style_name) {
          return {
            clause: ` AND s.name LIKE ?`,
            values: [`%${style_name}%`]
          };
        } else {
          return { clause: '', values: [] };
        }
      }

      if (type === 'issued') {
        sql = `
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
        `;
        const searchCond = buildSearchCondition('si');
        sql += searchCond.clause;
        params.push(...searchCond.values);
        orderBy = ' ORDER BY si.issued_at DESC';
      } else if (type === 'grn') {
        sql = `
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
        `;
        const searchCond = buildSearchCondition('sr');
        sql += searchCond.clause;
        params.push(...searchCond.values);
        orderBy = ' ORDER BY sr.created_at DESC';
      } else {
        // default to main
        sql = `
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
        `;
        if (style_number && style_name) {
          sql += ' AND ( mss.style_number LIKE ? OR LOWER(TRIM(s.name)) LIKE LOWER(?) )';
          params.push(`%${style_number}%`, `%${style_name.trim()}%`);
        } else if (style_number) {
          sql += ' AND mss.style_number LIKE ?';
          params.push(`%${style_number}%`);
        } else if (style_name) {
          sql += ' AND LOWER(TRIM(s.name)) LIKE LOWER(?)';
          params.push(`%${style_name.trim()}%`);
        }
        orderBy = ' ORDER BY mss.updated_at DESC';
      }

      sql += orderBy + ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // pagination-count query
      let countSql = '';
      if (type === 'issued') {
        countSql = 'SELECT COUNT(*) as total FROM stock_issuing WHERE company_code = ?';
      } else if (type === 'grn') {
        countSql = 'SELECT COUNT(*) as total FROM stock_received WHERE company_code = ?';
      } else {
        countSql = 'SELECT COUNT(*) as total FROM main_stock_summary WHERE company_code = ?';
      }

      db.query(countSql, [company_code], (err, countResult) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        db.query(sql, params, (err, results) => {
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
