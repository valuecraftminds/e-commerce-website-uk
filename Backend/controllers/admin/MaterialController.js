const db = require('../../config/database'); // adjust the path as necessary

const MaterialController = {
  getMaterials: (req, res) => {
    const { company_code } = req.query;
    const sql = 'SELECT * FROM materials WHERE company_code = ? ORDER BY material_name';
    db.query(sql, [company_code], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error fetching materials' });
      res.json({ success: true, materials: results });
    });
  },

  addMaterial: (req, res) => {
    const { company_code, material_name, description } = req.body;
    const sql = 'INSERT INTO materials (company_code, material_name, description) VALUES (?, ?, ?)';
    db.query(sql, [company_code, material_name, description], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error adding material' });
      res.json({ success: true, material_id: result.insertId });
    });
  },

  updateMaterial: (req, res) => {
    const { material_id } = req.params;
    const { material_name, description } = req.body;

    const sql = 'UPDATE materials SET material_name = ?, description = ?, updated_at = NOW() WHERE material_id = ?';
    db.query(sql, [material_name, description, material_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error updating material' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }
      res.json({ success: true, message: 'Material updated successfully' });
    });
  },

  deleteMaterial: (req, res) => {
    const { material_id } = req.params;

    // Check if material is used in any style variants
    const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE material_id = ?';
    db.query(checkSql, [material_id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error checking material usage' });

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete material as it is being used in style variants'
        });
      }

      const deleteSql = 'DELETE FROM materials WHERE material_id = ?';
      db.query(deleteSql, [material_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error deleting material' });
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Material not found' });
        }
        res.json({ success: true, message: 'Material deleted successfully' });
      });
    });
  }
};

module.exports = MaterialController;
