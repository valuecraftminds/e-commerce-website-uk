const db = require('../../config/database'); // or wherever your db connection is

const ColorController = {
  getColors: (req, res) => {
    const { company_code } = req.query;
    const sql = 'SELECT * FROM colors WHERE company_code = ? ORDER BY color_name';
    db.query(sql, [company_code], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error fetching colors' });
      res.json({ success: true, colors: results });
    });
  },

  addColor: (req, res) => {
    const { company_code, color_name, color_code } = req.body;
    const sql = 'INSERT INTO colors (company_code, color_name, color_code) VALUES (?, ?, ?)';
    db.query(sql, [company_code, color_name, color_code], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error adding color' });
      res.json({ success: true, color_id: result.insertId });
    });
  },

  updateColor: (req, res) => {
    const { color_id } = req.params;
    const { color_name, color_code } = req.body;

    const sql = 'UPDATE colors SET color_name = ?, color_code = ?, updated_at = NOW() WHERE color_id = ?';
    db.query(sql, [color_name, color_code, color_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error updating color' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Color not found' });
      }
      res.json({ success: true, message: 'Color updated successfully' });
    });
  },

  deleteColor: (req, res) => {
    const { color_id } = req.params;

    // Check if color is used in any variants
    const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE color_id = ?';
    db.query(checkSql, [color_id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error checking color usage' });

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete color as it is being used in style variants'
        });
      }

      const deleteSql = 'DELETE FROM colors WHERE color_id = ?';
      db.query(deleteSql, [color_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error deleting color' });
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Color not found' });
        }
        res.json({ success: true, message: 'Color deleted successfully' });
      });
    });
  }
};

module.exports = ColorController;
