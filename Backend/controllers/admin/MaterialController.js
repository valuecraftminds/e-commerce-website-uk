const db = require('../../config/database'); // adjust the path as necessary

const MaterialController = {
  async getMaterials(req, res) {
    try {
      const { company_code } = req.query;
      const sql = 'SELECT * FROM materials WHERE company_code = ? ORDER BY material_name';
      const [results] = await db.query(sql, [company_code]);
      res.json({ success: true, materials: results });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching materials' });
    }
  },

  async addMaterial(req, res) {
    try {
      const { company_code, material_name, description } = req.body;
      const sql = 'INSERT INTO materials (company_code, material_name, description) VALUES (?, ?, ?)';
      const [result] = await db.query(sql, [company_code, material_name, description]);
      res.json({ success: true, material_id: result.insertId });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error adding material' });
    }
  },

  async updateMaterial(req, res) {
    try {
      const { material_id } = req.params;
      const { material_name, description } = req.body;

      const sql = 'UPDATE materials SET material_name = ?, description = ?, updated_at = NOW() WHERE material_id = ?';
      const [result] = await db.query(sql, [material_name, description, material_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }
      res.json({ success: true, message: 'Material updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error updating material' });
    }
  },

  async deleteMaterial(req, res) {
    try {
      const { material_id } = req.params;

      // Check if material is used in any style variants
      const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE material_id = ?';
      const [results] = await db.query(checkSql, [material_id]);

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete material as it is being used in style variants'
        });
      }

      const deleteSql = 'DELETE FROM materials WHERE material_id = ?';
      const [result] = await db.query(deleteSql, [material_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }
      res.json({ success: true, message: 'Material deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error deleting material' });
    }
  }
};

module.exports = MaterialController;
