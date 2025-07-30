const db = require('../../config/database'); // adjust path to your db config

const SizeController = {
  async getSizes(req, res) {
    try {
      const { company_code } = req.query;
      const sql = 'SELECT * FROM sizes WHERE company_code = ? ORDER BY size_order';
      const [results] = await db.query(sql, [company_code]);
      res.json({ success: true, sizes: results });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching sizes' });
    }
  },

  async addSize(req, res) {
    try {
      const { company_code, size_name, size_order } = req.body;
      const sql = 'INSERT INTO sizes (company_code, size_name, size_order) VALUES (?, ?, ?)';
      const [result] = await db.query(sql, [company_code, size_name, size_order]);
      res.json({ success: true, size_id: result.insertId });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error adding size' });
    }
  },

  async updateSize(req, res) {
    try {
      const { size_id } = req.params;
      const { size_name, size_order } = req.body;

      const sql = 'UPDATE sizes SET size_name = ?, size_order = ?, updated_at = NOW() WHERE size_id = ?';
      const [result] = await db.query(sql, [size_name, size_order, size_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Size not found' });
      }
      res.json({ success: true, message: 'Size updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error updating size' });
    }
  },

  async deleteSize(req, res) {
    try {
      const { size_id } = req.params;

      // Check if size is used in any variants
      const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE size_id = ?';
      const [results] = await db.query(checkSql, [size_id]);

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete size as it is being used in style variants'
        });
      }

      const deleteSql = 'DELETE FROM sizes WHERE size_id = ?';
      const [result] = await db.query(deleteSql, [size_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Size not found' });
      }
      res.json({ success: true, message: 'Size deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error deleting size' });
    }
  }
};

module.exports = SizeController;
