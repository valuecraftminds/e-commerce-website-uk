const db = require('../../config/database'); 

const productController = {
  // GET main categories
  getMainCategories: (req, res) => {
    console.log('getMainCategories called');
    console.log('Query params:', req.query);

    const { company_code } = req.query;

    if (!company_code) {
      console.log('ERROR: No company_code provided');
      return res.status(400).json({ error: 'Company code is required' });
    }

    const sql = `SELECT * FROM categories WHERE parent_id IS NULL AND company_code = ?`;
    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error retrieving main categories:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      console.log('Query successful. Results count:', results.length);
      res.status(200).json(results);
    });
  },

  // GET product types by main category ID
  getProductTypes: (req, res) => {
    const { parentId } = req.params;
    const { company_code } = req.query;

    const sql = `SELECT * FROM categories WHERE parent_id = ? AND company_code = ?`;
    db.query(sql, [parentId, company_code], (err, results) => {
      if (err) {
        console.error('Error retrieving subcategories:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      res.status(200).json({ success: true, categories: results });
    });
  },

  // GET styles by parent category ID
  getStylesByParentCategory: (req, res) => {
    const { parentId } = req.params;
    const { company_code } = req.query;

    const sql = `
      SELECT 
        s.*,
        c.category_name,
        c.category_id,
        parent_cat.category_name as parent_category_name,
        price,
        sv.offer_price,
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

    db.query(sql, [parentId, parentId, company_code], (err, results) => {
      if (err) {
        console.error('Error retrieving styles by parent category:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(200).json(results);
    });
  },

  // GET all styles
  getAllStyles: (req, res) => {
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
        sv.offer_price,
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

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error retrieving all styles:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      console.log('Query successful. Results count:', results.length);
      res.status(200).json(results);
    });
  },

  getProductDetails: (req, res) => {
    const { style_id } = req.params;
    const { company_code } = req.query;

    const sql = `
      SELECT
        s.style_id,
        s.style_code,
        s.name,
        s.description,
        s.image,
        sv.sku,
        sv.price,
        sv.offer_price,
        sz.size_name,
        sv.variant_id,
        c.color_name,
        c.color_code,
        c.color_id
      FROM styles s
      LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
      LEFT JOIN sizes sz ON sv.size_id = sz.size_id
      LEFT JOIN colors c ON sv.color_id = c.color_id
      WHERE s.style_id = ? 
      AND s.company_code = ?
      AND s.approved = 'yes'
    `;

    db.query(sql, [style_id, company_code], (err, results) => {
      if (err) {
        console.error('Error fetching product details:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get unique sizes
      const sizes = [...new Set(results.map(r => r.size_name).filter(Boolean))];

      // Create size-color mapping
      const sizeColorMap = {};
      const allColorsMap = new Map();

      results.forEach(r => {
        if (r.size_name && r.color_name && r.color_code) {
          // Add to size-specific colors
          if (!sizeColorMap[r.size_name]) {
            sizeColorMap[r.size_name] = new Map();
          }
          sizeColorMap[r.size_name].set(r.color_code, {
            name: r.color_name,
            code: r.color_code,
            color_id: r.color_id
          });

          // Add to all colors map
          allColorsMap.set(r.color_code, {
            name: r.color_name,
            code: r.color_code,
            color_id: r.color_id
          });
        }
      });

      // Convert size-color map to the desired format
      const availableBySize = {};
      Object.keys(sizeColorMap).forEach(size => {
        availableBySize[size] = Array.from(sizeColorMap[size].values());
      });

      // Get all unique colors
      const allColors = Array.from(allColorsMap.values());

      const product = results[0];
      const price = product.price;

      res.json({
        style_id: product.style_id,
        style_code: product.style_code,
        name: product.name,
        sku: product.sku,
        description: product.description,
        price,
        offer_price: product.offer_price,
        variant_id: product.variant_id,
        available_sizes: sizes,
        available_colors: allColors, // All available colors
        colors_by_size: availableBySize, // Colors available for each size
        image: product.image
      });
    });
  },

  // GET product listings
  getProductListings: (req, res) => {
    const { company_code } = req.query;

    if (!company_code) {
      return res.status(400).json({ error: 'Company code is required' });
    }

    const sql = `
      SELECT style_id, style_code, name, description, image 
      FROM styles 
      WHERE approved = 'yes' 
      AND company_code = ?
      ORDER BY created_at DESC
    `;

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error retrieving product listings:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(200).json(results);
    });
  },

  // Search products
  searchProducts: (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const { company_code } = req.query;

    if (!query.trim()) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
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

    db.query(sql, [
      searchPattern, searchPattern, searchPattern,
      company_code,
      exactPattern, exactPattern, exactPattern
    ], (err, results) => {
      if (err) {
        console.error('Error searching styles:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      const transformedResults = results.map(item => ({
        style_id: item.style_id,
        style_code: item.style_code,
        name: item.name,
        description: item.description || '',
        image: item.image || null
      }));

      res.status(200).json(transformedResults);
    });
  },


// Get all styles that have variants with offer_price
  getStylesWithOfferPrice: (req, res) => {
    const { company_code } = req.query || req.params;

    if (!company_code) {
      return res.status(400).json({ error: 'Company code is required' });
    }

    const sql = `
    SELECT 
      s.*,
      c.category_name,
      c.category_id,
      parent_cat.category_name as parent_category_name,
      sv.price,
      sv.offer_price,
      COUNT(DISTINCT sv.variant_id) as variant_count,
      ROUND(((sv.price - sv.offer_price) / sv.price) * 100, 2) as discount_percentage
    FROM styles s
    LEFT JOIN categories c ON s.category_id = c.category_id
    LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
    INNER JOIN style_variants sv ON s.style_code = sv.style_code 
    WHERE sv.is_active = 1 
    AND sv.offer_price IS NOT NULL 
    AND sv.offer_price > 0
    AND s.approved = 'yes' 
    AND s.company_code = ?
    GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
    ORDER BY discount_percentage DESC, s.created_at DESC
  `;

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error retrieving styles with offer price:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(200).json(results);
    });
  }

};

module.exports = productController;
