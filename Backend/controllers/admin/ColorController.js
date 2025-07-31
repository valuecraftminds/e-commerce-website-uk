const db = require('../../config/database');

const ColorController = {
  getColors(req, res) {
    const { company_code } = req.query;
    db.query(
      'SELECT * FROM colors WHERE company_code = ? ORDER BY color_name',
      [company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error fetching colors' });
          return;
        }
        res.json({ success: true, colors: results });
      }
    );
  },

  addColor(req, res) {
    const { company_code, color_name, color_code } = req.body;
    db.query(
      'INSERT INTO colors (company_code, color_name, color_code) VALUES (?, ?, ?)',
      [company_code, color_name, color_code],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error adding color' });
          return;
        }
        res.json({ success: true, color_id: result.insertId });
      }
    );
  },

  updateColor(req, res) {
    const { color_id } = req.params;
    const { color_name, color_code } = req.body;
    db.query(
      'UPDATE colors SET color_name = ?, color_code = ?, updated_at = NOW() WHERE color_id = ?',
      [color_name, color_code, color_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error updating color' });
          return;
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Color not found' });
        }
        res.json({ success: true, message: 'Color updated successfully' });
      }
    );
  },

  deleteColor(req, res) {
    const { color_id } = req.params;
    db.query(
      'SELECT COUNT(*) as count FROM style_variants WHERE color_id = ?',
      [color_id],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error checking color usage' });
          return;
        }

        if (results[0].count > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete color as it is being used in style variants'
          });
        }

        db.query(
          'DELETE FROM colors WHERE color_id = ?',
          [color_id],
          (err, result) => {
            if (err) {
              res.status(500).json({ success: false, message: 'Error deleting color' });
              return;
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({ success: false, message: 'Color not found' });
            }
            res.json({ success: true, message: 'Color deleted successfully' });
          }
        );
      }
    );
  }
};

module.exports = ColorController;
