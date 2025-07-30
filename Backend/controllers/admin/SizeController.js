const db = require('../../config/database'); // adjust path to your db config

const SizeController = {
  getSizes: (req, res) => {
    const { company_code } = req.query;
    const sql = 'SELECT * FROM sizes WHERE company_code = ? ORDER BY size_order';
    db.query(sql, [company_code], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error fetching sizes' });
      res.json({ success: true, sizes: results });
    });
  },

  addSize: (req, res) => {
    const { company_code, size_name, size_order } = req.body;
    const sql = 'INSERT INTO sizes (company_code, size_name, size_order) VALUES (?, ?, ?)';
    db.query(sql, [company_code, size_name, size_order], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error adding size' });
      res.json({ success: true, size_id: result.insertId });
    });
  },

  updateSize: (req, res) => {
    const { size_id } = req.params;
    const { size_name, size_order } = req.body;

    const sql = 'UPDATE sizes SET size_name = ?, size_order = ?, updated_at = NOW() WHERE size_id = ?';
    db.query(sql, [size_name, size_order, size_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error updating size' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Size not found' });
      }
      res.json({ success: true, message: 'Size updated successfully' });
    });
  },

  deleteSize: (req, res) => {
    const { size_id } = req.params;

    // Check if size is used in any variants
    const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE size_id = ?';
    db.query(checkSql, [size_id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error checking size usage' });

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete size as it is being used in style variants'
        });
      }

      const deleteSql = 'DELETE FROM sizes WHERE size_id = ?';
      db.query(deleteSql, [size_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error deleting size' });
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Size not found' });
        }
        res.json({ success: true, message: 'Size deleted successfully' });
      });
    });
  }
};

module.exports = SizeController;
