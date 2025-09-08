const db = require('../../config/database');
const fs = require('fs');
const path = require('path');

class MeasureGuideController {
  // Add new measure guide
  static addMeasureGuide(req, res) {
    const { company_code, main_category_id, sub_category_id } = req.body;
    const image = req.file;

    if (!company_code || !main_category_id || !sub_category_id || !image) {
      return res.status(400).json({
        success: false,
        message: 'Company code, main category, subcategory, and image are required'
      });
    }

    // Check if measure guide already exists for this company and subcategory
    const checkSql = `
      SELECT id FROM measure_guides 
      WHERE company_code = ? AND sub_category_id = ?
    `;

    db.query(checkSql, [company_code, sub_category_id], (err, results) => {
      if (err) {
        console.error('Error checking existing measure guide:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Measure guide already exists for this subcategory'
        });
      }

      // Insert new measure guide
      const insertSql = `
        INSERT INTO measure_guides (company_code, main_category_id, sub_category_id, image_path, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

      const imagePath = image.filename;

      db.query(insertSql, [company_code, main_category_id, sub_category_id, imagePath], (err, result) => {
        if (err) {
          console.error('Error adding measure guide:', err);
          // Delete uploaded file if database insert fails
          const filePath = path.join(__dirname, '../../uploads/measure-guides', image.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return res.status(500).json({
            success: false,
            message: 'Error saving measure guide'
          });
        }

        return res.json({
          success: true,
          message: 'Measure guide added successfully',
          measure_guide_id: result.insertId
        });
      });
    });
  }

  // Get measure guides by company
  static getMeasureGuides(req, res) {
    const { company_code } = req.query;

    if (!company_code) {
      return res.status(400).json({
        success: false,
        message: 'Company code is required'
      });
    }

    const sql = `
      SELECT 
        mg.id,
        mg.company_code,
        mg.main_category_id,
        mg.sub_category_id,
        mg.image_path,
        mg.created_at,
        mc.category_name as main_category_name,
        sc.category_name as sub_category_name
      FROM measure_guides mg
      JOIN categories mc ON mg.main_category_id = mc.category_id
      JOIN categories sc ON mg.sub_category_id = sc.category_id
      WHERE mg.company_code = ?
      ORDER BY mc.category_name, sc.category_name
    `;

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error fetching measure guides:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      return res.json({
        success: true,
        measure_guides: results
      });
    });
  }

  // Delete measure guide
  static deleteMeasureGuide(req, res) {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Measure guide ID is required'
      });
    }

    // First get the image path to delete the file
    const selectSql = 'SELECT image_path FROM measure_guides WHERE id = ?';

    db.query(selectSql, [id], (err, results) => {
      if (err) {
        console.error('Error fetching measure guide:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Measure guide not found'
        });
      }

      const imagePath = results[0].image_path;

      // Delete from database
      const deleteSql = 'DELETE FROM measure_guides WHERE id = ?';

      db.query(deleteSql, [id], (err, result) => {
        if (err) {
          console.error('Error deleting measure guide:', err);
          return res.status(500).json({
            success: false,
            message: 'Error deleting measure guide'
          });
        }

        // Delete image file
        if (imagePath) {
          const filePath = path.join(__dirname, '../../uploads/measure-guides', imagePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        return res.json({
          success: true,
          message: 'Measure guide deleted successfully'
        });
      });
    });
  }
}

module.exports = MeasureGuideController;
