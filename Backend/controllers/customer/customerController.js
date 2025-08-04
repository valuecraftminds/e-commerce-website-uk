const db = require('../../config/database');
const path = require('path');
const fs = require('fs');

const customerController = {
  // GET main categories
  getMainCategories: async (req, res) => {
    try {
      console.log('=== getMainCategories called ===');
      console.log('Query params:', req.query);
      
      const { company_code } = req.query;

      if (!company_code) {
        console.log('ERROR: No company_code provided');
        return res.status(400).json({ error: 'Company code is required' });
      }

      const sql = `SELECT * FROM categories WHERE parent_id IS NULL AND company_code = ?`;
      console.log('Executing SQL:', sql);
      console.log('With parameters:', [company_code]);

      // For mysql2/promise, use db.query() directly (no .promise())
      const [results] = await db.query(sql, [company_code]);
      
      console.log('Query successful. Results count:', results.length);
      res.status(200).json(results);
    } catch (err) {
      console.error('Error retrieving main categories:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // GET product types by main category ID
  getProductTypes: async (req, res) => {
    try {
      const { parentId } = req.params;
      const { company_code } = req.query;

      const sql = `SELECT * FROM categories WHERE parent_id = ? AND company_code = ?`;

      const [results] = await db.query(sql, [parentId, company_code]);
      
      res.status(200).json({ success: true, categories: results });
    } catch (err) {
      console.error('Error retrieving subcategories:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // GET styles by parent category ID
  getStylesByParentCategory: async (req, res) => {
    try {
      const { parentId } = req.params;
      const { company_code } = req.query;

      const sql = `
        SELECT 
          s.*,
          c.category_name,
          c.category_id,
          parent_cat.category_name as parent_category_name,
          MIN(sv.price) as min_price,
          MAX(sv.price) as max_price,
          COUNT(DISTINCT sv.variant_id) as variant_count
        FROM styles s
        LEFT JOIN categories c ON s.category_id = c.category_id
        LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
        LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
        WHERE (c.parent_id = ? OR c.category_id = ?) 
        AND s.approved = 'yes' 
        AND s.company_code = ?
        GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
        ORDER BY s.created_at DESC
      `;

      const [results] = await db.query(sql, [parentId, parentId, company_code]);
      
      res.status(200).json(results);
    } catch (err) {
      console.error('Error retrieving styles by parent category:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // GET all styles
  getAllStyles: async (req, res) => {
    try {
      console.log('=== getAllStyles called ===');
      console.log('Query params:', req.query);
      
      const { company_code } = req.query;

      if (!company_code) {
        console.log('ERROR: No company_code provided');
        return res.status(400).json({ error: 'Company code is required' });
      }

      const sql = `
        SELECT 
          s.*,
          c.category_name,
          c.category_id,
          parent_cat.category_name as parent_category_name,
          MIN(sv.price) as min_price,
          MAX(sv.price) as max_price,
          COUNT(DISTINCT sv.variant_id) as variant_count
        FROM styles s
        LEFT JOIN categories c ON s.category_id = c.category_id
        LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
        LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
        WHERE s.approved = 'yes' 
        AND s.company_code = ?
        GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
        ORDER BY s.created_at DESC
      `;

      console.log('Executing SQL for getAllStyles');
      const [results] = await db.query(sql, [company_code]);
      
      console.log('Query successful. Results count:', results.length);
      res.status(200).json(results);
    } catch (err) {
      console.error('Error retrieving all styles:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // GET product details
  getProductDetails: async (req, res) => {
    try {
      const { style_id } = req.params;
      const { company_code } = req.query;

      const sql = `
        SELECT
          s.style_id,
          s.style_code,
          s.name,
          s.description,
          s.image,
          sv.price,
          sz.size_name,
          c.color_name
        FROM styles s
        LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
        LEFT JOIN sizes sz ON sv.size_id = sz.size_id
        LEFT JOIN colors c ON sv.color_id = c.color_id
        WHERE s.style_id = ? 
        AND s.company_code = ?
        AND s.approved = 'yes'
      `;

      const [results] = await db.query(sql, [style_id, company_code]);

      if (results.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Group sizes and colors uniquely
      const sizes = [...new Set(results.map(r => r.size_name).filter(Boolean))];
      const colors = [...new Set(results.map(r => r.color_name).filter(Boolean))];

      const product = results[0];
      const price = results.length > 0 ? results[0].price : null;

      res.json({
        style_id: product.style_id,
        style_code: product.style_code,
        name: product.name,
        description: product.description,
        price,
        available_sizes: sizes,
        available_colors: colors,
        image: product.image
      });
    } catch (err) {
      console.error('Error fetching product details:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // GET product listings
  getProductListings: async (req, res) => {
    try {
      console.log('=== getProductListings called ===');
      console.log('Query params:', req.query);
      
      const { company_code } = req.query;

      if (!company_code) {
        console.log('ERROR: No company_code provided');
        return res.status(400).json({ error: 'Company code is required' });
      }

      const sql = `
        SELECT style_id, style_code, name, description, image 
        FROM styles 
        WHERE approved = 'yes' 
        AND company_code = ?
        ORDER BY created_at DESC
      `;

      console.log('Executing SQL for getProductListings');
      const [results] = await db.query(sql, [company_code]);
      
      console.log('Query successful. Results count:', results.length);
      res.status(200).json(results);
    } catch (err) {
      console.error('Error retrieving product listings:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Search products
  searchProducts: async (req, res) => {
    try {
      const query = req.query.q?.toLowerCase() || '';
      const { company_code } = req.query;

      if (!query.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Search query is required' 
        });
      }

      const sql = `
        SELECT
          s.style_id,
          s.style_code,
          s.name,
          s.description,
          s.image
        FROM styles s
        WHERE (s.name LIKE ? OR s.description LIKE ? OR s.style_code LIKE ?)
        AND s.approved = 'yes'
        AND s.company_code = ?
        ORDER BY 
          CASE 
            WHEN s.name LIKE ? THEN 1
            WHEN s.style_code LIKE ? THEN 2
            WHEN s.description LIKE ? THEN 3
            ELSE 4
          END,
          s.name ASC
        LIMIT 10
      `;

      const searchPattern = `%${query}%`;
      const exactPattern = `${query}%`;

      const [results] = await db.query(sql, [
        searchPattern, searchPattern, searchPattern,
        company_code,
        exactPattern, exactPattern, exactPattern
      ]);

      const transformedResults = results.map(item => ({
        style_id: item.style_id,
        style_code: item.style_code,
        name: item.name,
        description: item.description || '',
        image: item.image || null
      }));

      res.status(200).json(transformedResults);
    } catch (err) {
      console.error('Error searching styles:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // get style images
  getStyleImage: (req, res) => {
    const { filename } = req.params;
    
    const imagePath = path.join(__dirname, '../../uploads/styles', filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the file
    res.sendFile(imagePath);
  }
};

module.exports = customerController;