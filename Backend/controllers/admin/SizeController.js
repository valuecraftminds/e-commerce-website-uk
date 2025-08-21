const db = require('../../config/database');

const SizeController = {
  getSizes(req, res) {
    const { company_code } = req.query;
    db.query(
      'SELECT * FROM sizes WHERE company_code = ?',
      [company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error fetching sizes' });
          return;
        }
        res.json({ success: true, sizes: results });
      }
    );
  },

  addSize(req, res) {
    const { company_code, size_name } = req.body;
    db.query(
      'INSERT INTO sizes (company_code, size_name) VALUES (?, ?, ?)',
      [company_code, size_name],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error adding size' });
          return;
        }
        res.json({ success: true, size_id: result.insertId });
      }
    );
  },

  updateSize(req, res) {
    const { size_id } = req.params;
    const { size_name } = req.body;
    db.query(
      'UPDATE sizes SET size_name = ?, updated_at = NOW() WHERE size_id = ?',
      [size_name, size_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error updating size' });
          return;
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Size not found' });
        }
        res.json({ success: true, message: 'Size updated successfully' });
      }
    );
  },

  deleteSize(req, res) {
    const { size_id } = req.params;
    db.query(
      'SELECT COUNT(*) as count FROM style_variants WHERE size_id = ?',
      [size_id],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error checking size usage' });
          return;
        }

        if (results[0].count > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete size as it is being used in style variants'
          });
        }

        db.query(
          'DELETE FROM sizes WHERE size_id = ?',
          [size_id],
          (err, result) => {
            if (err) {
              res.status(500).json({ success: false, message: 'Error deleting size' });
              return;
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({ success: false, message: 'Size not found' });
            }
            res.json({ success: true, message: 'Size deleted successfully' });
          }
        );
      }
    );
  }
};

module.exports = SizeController;
