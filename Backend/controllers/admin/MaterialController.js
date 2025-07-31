const db = require('../../config/database');

const MaterialController = {
  getMaterials(req, res) {
    const { company_code } = req.query;
    db.query(
      'SELECT * FROM materials WHERE company_code = ? ORDER BY material_name',
      [company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error fetching materials' });
          return;
        }
        res.json({ success: true, materials: results });
      }
    );
  },

  addMaterial(req, res) {
    const { company_code, material_name, description } = req.body;
    db.query(
      'INSERT INTO materials (company_code, material_name, description) VALUES (?, ?, ?)',
      [company_code, material_name, description],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error adding material' });
          return;
        }
        res.json({ success: true, material_id: result.insertId });
      }
    );
  },

  updateMaterial(req, res) {
    const { material_id } = req.params;
    const { material_name, description } = req.body;
    db.query(
      'UPDATE materials SET material_name = ?, description = ?, updated_at = NOW() WHERE material_id = ?',
      [material_name, description, material_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error updating material' });
          return;
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Material not found' });
        }
        res.json({ success: true, message: 'Material updated successfully' });
      }
    );
  },

  deleteMaterial(req, res) {
    const { material_id } = req.params;
    db.query(
      'SELECT COUNT(*) as count FROM style_variants WHERE material_id = ?',
      [material_id],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error checking material usage' });
          return;
        }

        if (results[0].count > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete material as it is being used in style variants'
          });
        }

        db.query(
          'DELETE FROM materials WHERE material_id = ?',
          [material_id],
          (err, result) => {
            if (err) {
              res.status(500).json({ success: false, message: 'Error deleting material' });
              return;
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({ success: false, message: 'Material not found' });
            }
            res.json({ success: true, message: 'Material deleted successfully' });
          }
        );
      }
    );
  }
};

module.exports = MaterialController;
