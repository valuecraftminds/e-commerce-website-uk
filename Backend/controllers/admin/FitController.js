const db = require('../../config/database'); // adjust the path if needed

const FitController = {
  getFits: (req, res) => {
    const { company_code } = req.query;
    const sql = 'SELECT * FROM fits WHERE company_code = ? ORDER BY fit_name';
    db.query(sql, [company_code], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error fetching fits' });
      res.json({ success: true, fits: results });
    });
  },

  addFit: (req, res) => {
    const { company_code, fit_name, description } = req.body;
    const sql = 'INSERT INTO fits (company_code, fit_name, description) VALUES (?, ?, ?)';
    db.query(sql, [company_code, fit_name, description], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error adding fit' });
      res.json({ success: true, fit_id: result.insertId });
    });
  },

  updateFit: (req, res) => {
    const { fit_id } = req.params;
    const { fit_name, description } = req.body;

    const sql = 'UPDATE fits SET fit_name = ?, description = ?, updated_at = NOW() WHERE fit_id = ?';
    db.query(sql, [fit_name, description, fit_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error updating fit' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Fit not found' });
      }
      res.json({ success: true, message: 'Fit updated successfully' });
    });
  },

  deleteFit: (req, res) => {
    const { fit_id } = req.params;

    // Check if fit is used in any style variants
    const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE fit_id = ?';
    db.query(checkSql, [fit_id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error checking fit usage' });

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete fit as it is being used in style variants'
        });
      }

      const deleteSql = 'DELETE FROM fits WHERE fit_id = ?';
      db.query(deleteSql, [fit_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error deleting fit' });
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Fit not found' });
        }
        res.json({ success: true, message: 'Fit deleted successfully' });
      });
    });
  }
};

module.exports = FitController;
