const db = require('../../config/database'); // adjust path as needed
const path = require('path');
const fs = require('fs');

const StyleController = {
  // Get all styles for a company
  getAllStyles(req, res) {
    const { company_code } = req.query;
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'Company code is required' });
    }

    console.log('Fetching styles for company:', company_code);

    const sql = `
      SELECT 
        s.*, c.category_name as subcategory_name, 
        p.category_name as main_category_name,
        p.category_id as main_category_id
      FROM styles s
      LEFT JOIN categories c ON s.category_id = c.category_id
      LEFT JOIN categories p ON c.parent_id = p.category_id
      WHERE s.company_code = ?
      ORDER BY s.created_at ASC
    `;

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching styles',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      console.log(`Found ${results.length} styles`);
      res.json({ success: true, styles: results });
    });
  },

  // Get single style by ID
  getStyleById(req, res) {
    const { style_id } = req.params;
    const sql = `
      SELECT s.*, c.category_name 
      FROM styles s
      LEFT JOIN categories c ON s.category_id = c.category_id
      WHERE s.style_id = ?
    `;
    
    db.query(sql, [style_id], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching style' });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Style not found' });
      }
      res.json({ success: true, style: results[0] });
    });
  },

  // Add new style
  addStyle(req, res) {
    const { company_code, style_number, name, description, category_id, approved } = req.body;
    const imagePaths = req.files ? req.files.map(file => file.filename).join(',') : null;

    if (!company_code || !style_number || !name || !category_id) {
      return res.status(400).json({ success: false, message: 'Company code, style number, name, and category are required' });
    }

    // Check for duplicate style_number (style_number)
    db.query('SELECT style_id FROM styles WHERE company_code = ? AND style_number = ?', [company_code, style_number], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error checking style number' });
      }
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'Style number already exists' });
      }

      const sql = `
        INSERT INTO styles (
          company_code, style_number, name, description, category_id, 
          image, approved, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      db.query(sql, 
        [company_code, style_number, name, description, category_id, imagePaths, approved || 'no'],
        (err, results) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error adding style' });
          }
          res.json({ 
            success: true, 
            style_id: results.insertId, 
            style_number: style_number, 
            image: imagePaths 
          });
        }
      );
    });
  },

  // Update style
  updateStyle(req, res) {
    const { style_id } = req.params;
    const { name, description, category_id, approved } = req.body;
    const imagePaths = req.files && req.files.length > 0 ? req.files.map(file => file.filename).join(',') : null;

    if (!name || !category_id) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    const checkSql = 'SELECT * FROM styles WHERE style_id = ?';
    db.query(checkSql, [style_id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error checking style' });
      }
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'Style not found' });
      }

      const existing = result[0];
      const updateSql = `
        UPDATE styles 
        SET name = ?, description = ?, category_id = ?, 
            ${imagePaths ? 'image = ?,' : ''} approved = ?, updated_at = NOW()
        WHERE style_id = ?
      `;
      const params = imagePaths
        ? [name, description, category_id, imagePaths, approved || 'no', style_id]
        : [name, description, category_id, approved || 'no', style_id];

      db.query(updateSql, params, (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error updating style' });
        }

        if (imagePaths && existing.image) {
          existing.image.split(',').forEach(img => {
            const filePath = path.join(__dirname, '../../uploads/styles', img);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          });
        }

        res.json({ success: true, message: 'Style updated', style: { ...existing, name, description, category_id, approved } });
      });
    });
  },


  // Update is_view status only
  updateIsView(req, res) {
    const { style_id } = req.params;
    const { is_view } = req.body;
    if (!['yes', 'no'].includes(is_view)) {
      return res.status(400).json({ success: false, message: 'Invalid is_view value' });
    }
    const sql = 'UPDATE styles SET is_view = ? WHERE style_id = ?';
    db.query(sql, [is_view, style_id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating is_view' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Style not found' });
      }
      res.json({ success: true, message: 'is_view updated' });
    });
  },

  // Delete style and its variants
  deleteStyle(req, res) {
    const { style_id } = req.params;

    const getSql = 'SELECT style_number FROM styles WHERE style_id = ?';
    db.query(getSql, [style_id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching style code' });
      }
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'Style not found' });
      }

      const styleNumber = result[0].style_number;

      db.query('DELETE FROM style_variants WHERE style_number = ?', [styleNumber], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error deleting style variants' });
        }

        db.query('DELETE FROM styles WHERE style_id = ?', [style_id], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting style', error: err.message });
          }
          res.json({ success: true, message: 'Style and variants deleted' });
        });
      });
    });
  },

  // Get variants for a style
  getStyleVariants(req, res) {
    const { company_code } = req.query;
    const { style_number } = req.params;
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'Company code is required' });
    }
    const sql = `
      SELECT sv.*, c.color_name, s.size_name, f.fit_name, m.material_name
      FROM style_variants sv
      LEFT JOIN colors c ON sv.color_id = c.color_id
      LEFT JOIN sizes s ON sv.size_id = s.size_id
      LEFT JOIN fits f ON sv.fit_id = f.fit_id
      LEFT JOIN materials m ON sv.material_id = m.material_id
      WHERE sv.style_number = ? AND sv.company_code = ?
      ORDER BY sv.created_at DESC
    `;
    db.query(sql, [style_number, company_code], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching variants' });
      }
      res.json({ success: true, variants: results });
    });
  },

  
  getStyleVariantsBySKU(req, res) {
    const { company_code } = req.query;
    const { sku } = req.params;
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'Company code is required' });
    }
    const sql = `
      SELECT 
        sv.*,
        c.color_name,
        s.size_name,
        f.fit_name,
        m.material_name,
        st.name as style_name,
        st.style_number
      FROM style_variants sv
      LEFT JOIN colors c ON sv.color_id = c.color_id
      LEFT JOIN sizes s ON sv.size_id = s.size_id
      LEFT JOIN fits f ON sv.fit_id = f.fit_id
      LEFT JOIN materials m ON sv.material_id = m.material_id
      LEFT JOIN styles st ON sv.style_number = st.style_number
      WHERE sv.sku = ? AND sv.company_code = ?
      LIMIT 1
    `;
    db.query(sql, [sku, company_code], (err, results) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching variant details',
          error: err.message 
        });
      }
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Variant not found'
        });
      }
      res.json({ success: true, variant: results[0] });
    });
  },

  // Add variant
  addVariant(req, res) {
    const { company_code, style_number, color_id, size_id, fit_id, material_id, unit_price, sale_price, sku } = req.body;
    if (!company_code || !style_number || !color_id || !size_id || !fit_id || !material_id) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // If not provided, save as zero
    const parsedUnitPrice = parseFloat(unit_price) || 0;
    const parsedPrice = parseFloat(sale_price) || 0;

    if (!sku) {
      return res.status(400).json({ success: false, message: 'SKU is required from frontend' });
    }

    // Check if SKU is unique within the same company_code
    const skuCheckSql = `
      SELECT variant_id FROM style_variants WHERE company_code = ? AND sku = ?
    `;
    db.query(skuCheckSql, [company_code, sku], (err, skuResults) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error checking SKU uniqueness' });
      }

      // If updating, allow the same variant to keep its SKU
      const checkSql = `
        SELECT variant_id FROM style_variants 
        WHERE style_number = ? AND company_code=? AND color_id = ? AND size_id = ? AND fit_id = ? AND material_id = ?
      `;
      db.query(checkSql, [style_number, company_code, color_id, size_id, fit_id, material_id], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error checking variant' });
        }

        if (results.length > 0) {
          // Variant exists, update it
          const variant_id = results[0].variant_id;
          // If SKU exists in another variant for this company, block
          if (skuResults.length > 0 && skuResults[0].variant_id !== variant_id) {
            return res.status(409).json({ success: false, message: 'SKU already exists for this company' });
          }
          const updateSql = `
            UPDATE style_variants 
            SET color_id = ?, size_id = ?, fit_id = ?, material_id = ?, unit_price = ?, sale_price = ?, sku = ?, updated_at = NOW()
            WHERE variant_id = ?
          `;
          db.query(updateSql, [
            color_id, size_id, fit_id, material_id, parsedUnitPrice, parsedPrice, sku, variant_id
          ], (err) => {
            if (err) {
              console.error('Error updating variant:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Error updating variant',
                error: err.message 
              });
            }
            res.json({ 
              success: true, 
              message: 'Variant updated', 
              sku,
              unit_price: parsedUnitPrice,
              sale_price: parsedPrice
            });
          });
        } else {
          // Insert new variant
          if (skuResults.length > 0) {
            return res.status(409).json({ success: false, message: 'SKU already exists for this company' });
          }
          const insertSql = `
            INSERT INTO style_variants 
            (company_code, style_number, color_id, size_id, fit_id, material_id, unit_price, sale_price, sku, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
          `;
          db.query(insertSql, [
            company_code, style_number, color_id, size_id, fit_id, material_id, 
            parsedUnitPrice, parsedPrice, sku
          ], (err) => {
            if (err) {
              console.error('Error adding variant:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Error adding variant',
                error: err.message 
              });
            }
            res.json({ 
              success: true, 
              message: 'Variant added', 
              sku,
              unit_price: parsedUnitPrice,
              sale_price: parsedPrice
            });
          });
        }
      });
    });
  },

  // Update variant
  updateVariant(req, res) {
    const { variant_id } = req.params;
  let { color_id, size_id, fit_id, material_id, unit_price, sale_price, sku, company_code, style_number } = req.body;

    // If not provided, save as zero
    if (unit_price === undefined || unit_price === null || unit_price === '') unit_price = 0;
    if (sale_price === undefined || sale_price === null || sale_price === '') sale_price = 0;
    if (!sku) {
      return res.status(400).json({ success: false, message: 'SKU is required from frontend' });
    }

    const checkSql = `
      SELECT variant_id FROM style_variants 
      WHERE color_id = ? AND size_id = ? AND fit_id = ? AND company_code = ? AND style_number = ? AND variant_id != ?
    `;
    db.query(checkSql, [color_id, size_id, fit_id, company_code, style_number, variant_id], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error checking variant' });
      }
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'Variant already exists' });
      }

      // Parse unit_price and price as floats
      const parsedUnitPrice = parseFloat(unit_price) || 0;
      const parsedPrice = parseFloat(sale_price) || 0;

      const updateSql = `
        UPDATE style_variants 
        SET color_id = ?, 
            size_id = ?, 
            fit_id = ?, 
            material_id = ?, 
            unit_price = ?, 
            sale_price = ?, 
            sku = ?, 
            updated_at = NOW()
        WHERE variant_id = ?
      `;
      db.query(updateSql, [
        color_id, size_id, fit_id, material_id, 
        parsedUnitPrice, parsedPrice, sku, variant_id
      ], (err) => {
        if (err) {
          console.error('Error updating variant:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Error updating variant',
            error: err.message 
          });
        }
        res.json({ 
          success: true, 
          message: 'Variant updated', 
          sku,
          unit_price: parsedUnitPrice,
          sale_price: parsedPrice
        });
      });
    });
  },

  // Delete variant
  deleteVariant(req, res) {
    const { variant_id } = req.params;
    db.query('DELETE FROM style_variants WHERE variant_id = ?', [variant_id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error deleting variant' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Variant not found' });
      }
      res.json({ success: true, message: 'Variant deleted' });
    });
  },

  // Search variants
  searchVariants(req, res) {
    const { search, company_code } = req.query;
    
    const sql = `
        SELECT 
            sv.*,
            c.color_name,
            s.size_name,
            f.fit_name,
            m.material_name,
            st.name as style_name,
            st.style_number
        FROM style_variants sv
        LEFT JOIN colors c ON sv.color_id = c.color_id
        LEFT JOIN sizes s ON sv.size_id = s.size_id
        LEFT JOIN fits f ON sv.fit_id = f.fit_id
        LEFT JOIN materials m ON sv.material_id = m.material_id
        LEFT JOIN styles st ON sv.style_number = st.style_number
        WHERE sv.company_code = ?
        AND (sv.sku LIKE ? OR st.name LIKE ?)
        LIMIT 20
    `;
    
    const searchTerm = `%${search}%`;
    
    db.query(sql, [company_code, searchTerm, searchTerm], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error searching variants',
                error: err.message 
            });
        }
        res.json({ success: true, variants: results });
    });
  }
};

module.exports = StyleController;
