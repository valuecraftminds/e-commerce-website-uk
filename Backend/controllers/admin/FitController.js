const db = require('../../config/database'); // adjust the path if needed

const FitController = {
  async getFits(req, res) {
    try {
      const { company_code } = req.query;
      const sql = 'SELECT * FROM fits WHERE company_code = ? ORDER BY fit_name';
      const [results] = await db.query(sql, [company_code]);
      res.json({ success: true, fits: results });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching fits' });
    }
  },

  async addFit(req, res) {
    try {
      const { company_code, fit_name, description } = req.body;
      const sql = 'INSERT INTO fits (company_code, fit_name, description) VALUES (?, ?, ?)';
      const [result] = await db.query(sql, [company_code, fit_name, description]);
      res.json({ success: true, fit_id: result.insertId });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error adding fit' });
    }
  },

  async updateFit(req, res) {
    try {
      const { fit_id } = req.params;
      const { fit_name, description } = req.body;

      const sql = 'UPDATE fits SET fit_name = ?, description = ?, updated_at = NOW() WHERE fit_id = ?';
      const [result] = await db.query(sql, [fit_name, description, fit_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Fit not found' });
      }
      res.json({ success: true, message: 'Fit updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error updating fit' });
    }
  },

  async deleteFit(req, res) {
    try {
      const { fit_id } = req.params;

      // Check if fit is used in any style variants
      const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE fit_id = ?';
      const [results] = await db.query(checkSql, [fit_id]);

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete fit as it is being used in style variants'
        });
      }

      const deleteSql = 'DELETE FROM fits WHERE fit_id = ?';
      const [result] = await db.query(deleteSql, [fit_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Fit not found' });
      }
      res.json({ success: true, message: 'Fit deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error deleting fit' });
    }
  }
};

module.exports = FitController;
