const db = require('../../config/database');

const StyleAttributesController = {
  // Get a specific style by style_number
  getStyle(req, res) {
    const { style_number } = req.params;
    const { company_code } = req.query;

    db.query(
      'SELECT * FROM styles WHERE style_number = ? AND company_code = ?',
      [style_number, company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error fetching style' });
          return;
        }
        if (results.length === 0) {
          return res.status(404).json({ success: false, message: 'Style not found' });
        }
        res.json({ success: true, style: results[0] });
      }
    );
  },

  // Get all attributes for a specific style
  getStyleAttributes(req, res) {
    const { style_number } = req.params;
    const { company_code } = req.query;

    const queries = {
      colors: `SELECT c.* FROM colors c 
               INNER JOIN style_colors sc ON c.color_id = sc.color_id 
               WHERE sc.style_number = ? AND sc.company_code = ?`,
      // For sizes, get all sizes for each assigned size_range_id
      sizes: `SELECT s.* FROM sizes s 
                INNER JOIN style_size_ranges ssr ON s.size_range_id = ssr.size_range_id 
                WHERE ssr.style_number = ? AND ssr.company_code = ?`,
      materials: `SELECT m.* FROM materials m 
                  INNER JOIN style_materials sm ON m.material_id = sm.material_id 
                  WHERE sm.style_number = ? AND sm.company_code = ?`,
      fits: `SELECT f.* FROM fits f 
             INNER JOIN style_fits sf ON f.fit_id = sf.fit_id 
             WHERE sf.style_number = ? AND sf.company_code = ?`
    };

    Promise.all([
      new Promise((resolve, reject) => {
        db.query(queries.colors, [style_number, company_code], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(queries.sizes, [style_number, company_code], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(queries.materials, [style_number, company_code], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(queries.fits, [style_number, company_code], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      })
    ])
    .then(([colors, sizes, materials, fits]) => {
      res.json({
        success: true,
        colors,
        sizes,
        materials,
        fits
      });
    })
    .catch(err => {
      console.error('Error fetching style attributes:', err);
      res.status(500).json({ success: false, message: 'Error fetching style attributes' });
    });
  },

  // Add attributes to a style
  addStyleAttributes(req, res) {
    const { style_number, company_code, type, attribute_ids } = req.body;

    if (!style_number || !company_code || !type || !attribute_ids || attribute_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const tableMap = {
      colors: { table: 'style_colors', column: 'color_id' },
      sizes: { table: 'style_size_ranges', column: 'size_range_id' },
      materials: { table: 'style_materials', column: 'material_id' },
      fits: { table: 'style_fits', column: 'fit_id' }
    };

    const config = tableMap[type];
    if (!config) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid attribute type' 
      });
    }

    const values = attribute_ids.map(id => [style_number, company_code, id]);
    const placeholders = values.map(() => '(?, ?, ?)').join(', ');
    const flatValues = values.flat();

    const query = `INSERT INTO ${config.table} (style_number, company_code, ${config.column}) VALUES ${placeholders}`;

    db.query(query, flatValues, (err, result) => {
      if (err) {
        console.error('Error adding style attributes:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ 
            success: false, 
            message: 'Some attributes are already added to this style' 
          });
        }
        res.status(500).json({ 
          success: false, 
          message: 'Error adding attributes to style' 
        });
        return;
      }
      res.json({ 
        success: true, 
        message: `${type} added to style successfully`,
        affected_rows: result.affectedRows 
      });
    });
  },

  // Remove attribute from a style
  removeStyleAttribute(req, res) {
    const { style_number, company_code, type, attribute_id } = req.body;

    if (!style_number || !company_code || !type || !attribute_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Map for table/column names
    const tableMap = {
      colors: { table: 'style_colors', column: 'color_id', variantCol: 'color_id' },
      sizes: { table: 'style_size_ranges', column: 'size_range_id', variantCol: 'size_range_id' },
      materials: { table: 'style_materials', column: 'material_id', variantCol: 'material_id' },
      fits: { table: 'style_fits', column: 'fit_id', variantCol: 'fit_id' }
    };
    const config = tableMap[type];
    if (!config) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid attribute type' 
      });
    }

    if (type === 'sizes') {
      // For sizes, attribute_id is size_range_id. Check if any sizes in this range are used in style_variants for this style.
      db.query('SELECT size_id FROM sizes WHERE size_range_id = ?', [attribute_id], (err, sizes) => {
        if (err) {
          console.error('Error fetching sizes for size range:', err);
          return res.status(500).json({
            success: false,
            message: 'Error checking attribute usage in variants'
          });
        }
        if (!sizes.length) {
          // No sizes, safe to delete
          proceedDelete();
          return;
        }
        const sizeIds = sizes.map(s => s.size_id);
        db.query(
          `SELECT COUNT(*) as count FROM style_variants WHERE style_number = ? AND company_code = ? AND size_id IN (?)`,
          [style_number, company_code, sizeIds],
          (err2, results) => {
            if (err2) {
              console.error('Error checking style_variants:', err2);
              return res.status(500).json({
                success: false,
                message: 'Error checking attribute usage in variants'
              });
            }
            if (results[0].count > 0) {
              return res.status(400).json({
                success: false,
                message: `Cannot remove this size range because one or more sizes are used in style variants.`
              });
            }
            proceedDelete();
          }
        );
        function proceedDelete() {
          const query = `DELETE FROM style_size_ranges WHERE style_number = ? AND company_code = ? AND size_range_id = ?`;
          db.query(query, [style_number, company_code, attribute_id], (err, result) => {
            if (err) {
              console.error('Error removing style attribute:', err);
              res.status(500).json({ 
                success: false, 
                message: 'Error removing attribute from style' 
              });
              return;
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({ 
                success: false, 
                message: 'Attribute not found for this style' 
              });
            }
            res.json({ 
              success: true, 
              message: 'Size range removed from style successfully' 
            });
          });
        }
      });
    } else {
      // Non-size attributes: original logic
      const variantCheckQuery = `SELECT COUNT(*) as count FROM style_variants WHERE style_number = ? AND company_code = ? AND ${config.variantCol} = ?`;
      db.query(variantCheckQuery, [style_number, company_code, attribute_id], (err, results) => {
        if (err) {
          console.error('Error checking style_variants:', err);
          return res.status(500).json({
            success: false,
            message: 'Error checking attribute usage in variants'
          });
        }
        if (results[0].count > 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot remove this ${type.slice(0, -1)} because it is used in style variants.`
          });
        }
        // Proceed to delete from style_xxx table
        const query = `DELETE FROM ${config.table} WHERE style_number = ? AND company_code = ? AND ${config.column} = ?`;
        db.query(query, [style_number, company_code, attribute_id], (err, result) => {
          if (err) {
            console.error('Error removing style attribute:', err);
            res.status(500).json({ 
              success: false, 
              message: 'Error removing attribute from style' 
            });
            return;
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ 
              success: false, 
              message: 'Attribute not found for this style' 
            });
          }
          res.json({ 
            success: true, 
            message: `${type.slice(0, -1)} removed from style successfully` 
          });
        });
      });
    }
  },

  // Get size guide for a style
  getSizeGuide(req, res) {
    const { style_number } = req.params;
    const { company_code } = req.query;

    if (!style_number || !company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    db.query(
      'SELECT size_guide_content FROM size_guides WHERE style_number = ? AND company_code = ?',
      [style_number, company_code],
      (err, results) => {
        if (err) {
          console.error('Error fetching size guide:', err);
          res.status(500).json({ 
            success: false, 
            message: 'Error fetching size guide' 
          });
          return;
        }
        
        if (results.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Size guide not found' 
          });
        }
        
        res.json({ 
          success: true, 
          size_guide_content: results[0].size_guide_content 
        });
      }
    );
  },

  // Save or update size guide for a style
  saveSizeGuide(req, res) {
    const { style_number, company_code, size_guide_content } = req.body;

    if (!style_number || !company_code || size_guide_content === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const query = `
      INSERT INTO size_guides (style_number, company_code, size_guide_content) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
      size_guide_content = VALUES(size_guide_content), 
      updated_at = CURRENT_TIMESTAMP
    `;

    db.query(query, [style_number, company_code, size_guide_content], (err, result) => {
      if (err) {
        console.error('Error saving size guide:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Error saving size guide' 
        });
        return;
      }
      
      res.json({ 
        success: true, 
        message: 'Size guide saved successfully' 
      });
    });
  }
};

module.exports = StyleAttributesController;