const db = require('../../config/database');

const FitController = {
  getFits(req, res) {
    const { company_code } = req.query;
    db.query(
      'SELECT * FROM fits WHERE company_code = ? ORDER BY fit_name',
      [company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error fetching fits' });
          return;
        }
        res.json({ success: true, fits: results });
      }
    );
  },

  addFit(req, res) {
    const { company_code, fit_name, description } = req.body;
    db.query(
      'INSERT INTO fits (company_code, fit_name, description) VALUES (?, ?, ?)',
      [company_code, fit_name, description],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error adding fit' });
          return;
        }
        res.json({ success: true, fit_id: result.insertId });
      }
    );
  },

  updateFit(req, res) {
    const { fit_id } = req.params;
    const { fit_name, description } = req.body;
    db.query(
      'UPDATE fits SET fit_name = ?, description = ?, updated_at = NOW() WHERE fit_id = ?',
      [fit_name, description, fit_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error updating fit' });
          return;
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Fit not found' });
        }
        res.json({ success: true, message: 'Fit updated successfully' });
      }
    );
  },

  deleteFit(req, res) {
    const { fit_id } = req.params;
    db.query(
      'SELECT COUNT(*) as count FROM style_variants WHERE fit_id = ?',
      [fit_id],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error checking fit usage' });
          return;
        }

        if (results[0].count > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete fit as it is being used in style variants'
          });
        }

        db.query(
          'DELETE FROM fits WHERE fit_id = ?',
          [fit_id],
          (err, result) => {
            if (err) {
              res.status(500).json({ success: false, message: 'Error deleting fit' });
              return;
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({ success: false, message: 'Fit not found' });
            }
            res.json({ success: true, message: 'Fit deleted successfully' });
          }
        );
      }
    );
  }
};

module.exports = FitController;
