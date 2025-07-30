const db = require('../../config/database');

const ColorController = {
  async getColors(req, res) {
    try {
      const { company_code } = req.query;
      const sql = 'SELECT * FROM colors WHERE company_code = ? ORDER BY color_name';
      const [results] = await db.query(sql, [company_code]);
      res.json({ success: true, colors: results });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching colors' });
    }
  },

  async addColor(req, res) {
    try {
      const { company_code, color_name, color_code } = req.body;
      const sql = 'INSERT INTO colors (company_code, color_name, color_code) VALUES (?, ?, ?)';
      const [result] = await db.query(sql, [company_code, color_name, color_code]);
      res.json({ success: true, color_id: result.insertId });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error adding color' });
    }
  },

  async updateColor(req, res) {
    try {
      const { color_id } = req.params;
      const { color_name, color_code } = req.body;
      const sql = 'UPDATE colors SET color_name = ?, color_code = ?, updated_at = NOW() WHERE color_id = ?';
      const [result] = await db.query(sql, [color_name, color_code, color_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Color not found' });
      }
      res.json({ success: true, message: 'Color updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error updating color' });
    }
  },

  async deleteColor(req, res) {
    try {
      const { color_id } = req.params;
      const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE color_id = ?';
      const [results] = await db.query(checkSql, [color_id]);

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete color as it is being used in style variants'
        });
      }

      const [result] = await db.query('DELETE FROM colors WHERE color_id = ?', [color_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Color not found' });
      }
      res.json({ success: true, message: 'Color deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error deleting color' });
    }
  }
};

module.exports = ColorController;
