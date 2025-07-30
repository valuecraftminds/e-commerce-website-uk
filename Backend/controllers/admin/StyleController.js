const db = require('../../config/database'); // adjust path as needed
const path = require('path');
const fs = require('fs');

const StyleController = {
  // Get all styles for a company
  async getAllStyles(req, res) {
    try {
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
        ORDER BY s.created_at DESC
      `;

      const [results] = await db.query(sql, [company_code]);
      console.log(`Found ${results.length} styles`);
      res.json({ success: true, styles: results });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching styles',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  // Get single style by ID
  async getStyleById(req, res) {
    try {
      const { style_id } = req.params;
      const sql = `
        SELECT s.*, c.category_name 
        FROM styles s
        LEFT JOIN categories c ON s.category_id = c.category_id
        WHERE s.style_id = ?
      `;
      const [results] = await db.query(sql, [style_id]);
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Style not found' });
      }
      res.json({ success: true, style: results[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching style' });
    }
  },

  // Add new style
  async addStyle(req, res) {
    try {
      const { company_code, name, description, category_id, approved } = req.body;
      const imagePaths = req.files ? req.files.map(file => file.filename).join(',') : null;

      if (!company_code || !name || !category_id) {
        return res.status(400).json({ success: false, message: 'Company code, name, and category are required' });
      }

      const generateStyleCode = async (baseName, attempt = 0) => {
        let code = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
        if (attempt > 0) code += attempt;

        const sql = 'SELECT style_id FROM styles WHERE company_code = ? AND style_code = ?';
        const [results] = await db.query(sql, [company_code, code]);
        return results.length > 0
          ? generateStyleCode(baseName, attempt + 1)
          : code;
      };

      const styleCode = await generateStyleCode(name);
      const sql = `
        INSERT INTO styles (
          company_code, style_code, name, description, category_id, 
          image, approved, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      const [results] = await db.query(sql, [company_code, styleCode, name, description, category_id, imagePaths, approved || 'no']);
      res.json({ success: true, style_id: results.insertId, style_code: styleCode, image: imagePaths });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error adding style' });
    }
  },

  // Update style
  async updateStyle(req, res) {
    try {
      const { style_id } = req.params;
      const { name, description, category_id, approved } = req.body;
      const imagePaths = req.files && req.files.length > 0 ? req.files.map(file => file.filename).join(',') : null;

      if (!name || !category_id) {
        return res.status(400).json({ success: false, message: 'Name and category are required' });
      }

      const checkSql = 'SELECT * FROM styles WHERE style_id = ?';
      const [result] = await db.query(checkSql, [style_id]);
      if (result.length === 0) return res.status(404).json({ success: false, message: 'Style not found' });

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

      await db.query(updateSql, params);

      if (imagePaths && existing.image) {
        existing.image.split(',').forEach(img => {
          const filePath = path.join(__dirname, '../../uploads/styles', img);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }

      res.json({ success: true, message: 'Style updated', style: { ...existing, name, description, category_id, approved } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error updating style' });
    }
  },

  // Delete style and its variants
  async deleteStyle(req, res) {
    try {
      const { style_id } = req.params;

      const getSql = 'SELECT style_code FROM styles WHERE style_id = ?';
      const [result] = await db.query(getSql, [style_id]);
      if (result.length === 0) return res.status(404).json({ success: false, message: 'Style not found' });

      const styleCode = result[0].style_code;

      await db.query('DELETE FROM style_variants WHERE style_code = ?', [styleCode]);
      await db.query('DELETE FROM styles WHERE style_id = ?', [style_id]);
      res.json({ success: true, message: 'Style and variants deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error deleting style' });
    }
  },

  // Get variants for a style
  async getStyleVariants(req, res) {
    try {
      const sql = `
        SELECT sv.*, c.color_name, s.size_name, f.fit_name, m.material_name
        FROM style_variants sv
        LEFT JOIN colors c ON sv.color_id = c.color_id
        LEFT JOIN sizes s ON sv.size_id = s.size_id
        LEFT JOIN fits f ON sv.fit_id = f.fit_id
        LEFT JOIN materials m ON sv.material_id = m.material_id
        WHERE sv.style_code = ?
        ORDER BY sv.created_at DESC
      `;
      const [results] = await db.query(sql, [req.params.style_code]);
      res.json({ success: true, variants: results });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching variants' });
    }
  },

  // Add variant
  async addVariant(req, res) {
    try {
      const { company_code, style_code, color_id, size_id, fit_id, material_id, price } = req.body;
      if (!company_code || !style_code || !color_id || !size_id || !fit_id || !material_id || !price) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      const checkSql = `
        SELECT variant_id FROM style_variants 
        WHERE style_code = ? AND color_id = ? AND size_id = ? AND fit_id = ?
      `;
      const [results] = await db.query(checkSql, [style_code, color_id, size_id, fit_id]);
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'Variant already exists' });
      }

      const detailsSql = `
        SELECT c.color_name, s.size_name, f.fit_name 
        FROM colors c, sizes s, fits f 
        WHERE c.color_id = ? AND s.size_id = ? AND f.fit_id = ?
      `;
      const [result] = await db.query(detailsSql, [color_id, size_id, fit_id]);

      const d = result[0];
      const sku = `${style_code}-${d.color_name.substring(0,3).toUpperCase()}-${d.size_name}-${d.fit_name.substring(0,3).toUpperCase()}`;
      const insertSql = `
        INSERT INTO style_variants (company_code, style_code, color_id, size_id, fit_id, material_id, price, sku, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
      `;
      await db.query(insertSql, [company_code, style_code, color_id, size_id, fit_id, material_id, price, sku]);
      res.json({ success: true, message: 'Variant added', sku });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error adding variant' });
    }
  },

  // Update variant
  async updateVariant(req, res) {
    try {
      const { variant_id } = req.params;
      const { color_id, size_id, fit_id, material_id, price } = req.body;

      const checkSql = `
        SELECT variant_id FROM style_variants 
        WHERE color_id = ? AND size_id = ? AND fit_id = ? AND variant_id != ?
      `;
      const [results] = await db.query(checkSql, [color_id, size_id, fit_id, variant_id]);
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'Variant already exists' });
      }

      const detailsSql = `
        SELECT s.style_code, c.color_name, s2.size_name, f.fit_name 
        FROM style_variants sv
        JOIN styles s ON sv.style_code = s.style_code
        JOIN colors c ON c.color_id = ?
        JOIN sizes s2 ON s2.size_id = ?
        JOIN fits f ON f.fit_id = ?
        WHERE sv.variant_id = ?
      `;
      const [result] = await db.query(detailsSql, [color_id, size_id, fit_id, variant_id]);

      const d = result[0];
      const sku = `${d.style_code}-${d.color_name.substring(0,3).toUpperCase()}-${d.size_name}-${d.fit_name.substring(0,3).toUpperCase()}`;
      const updateSql = `
        UPDATE style_variants 
        SET color_id = ?, size_id = ?, fit_id = ?, material_id = ?, price = ?, sku = ?, updated_at = NOW()
        WHERE variant_id = ?
      `;
      await db.query(updateSql, [color_id, size_id, fit_id, material_id, price, sku, variant_id]);
      res.json({ success: true, message: 'Variant updated', sku });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error updating variant' });
    }
  },

  // Delete variant
  async deleteVariant(req, res) {
    try {
      const { variant_id } = req.params;
      const [result] = await db.query('DELETE FROM style_variants WHERE variant_id = ?', [variant_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Variant not found' });
      }
      res.json({ success: true, message: 'Variant deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error deleting variant' });
    }
  }
};

module.exports = StyleController;
