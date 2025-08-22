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
        MIN(sv.sale_price) as min_sale_price,
        MAX(sv.sale_price) as max_sale_price,
        sv.offer_price,
        COUNT(DISTINCT sv.variant_id) as variant_count
      FROM styles s
      LEFT JOIN categories c ON s.category_id = c.category_id
      LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
      LEFT JOIN style_variants sv ON s.style_number = sv.style_number AND sv.is_active = 1
      WHERE (c.parent_id = ? OR c.category_id = ?) 
      AND s.approved = 'yes' 
      AND s.company_code = ?
      GROUP BY s.style_id, s.style_number, s.name, s.description, s.category_id, s.image
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
        MIN(sv.sale_price) as min_sale_price,
        MAX(sv.sale_price) as max_sale_price,
        sv.offer_price,
        COUNT(DISTINCT sv.variant_id) as variant_count
      FROM styles s
      LEFT JOIN categories c ON s.category_id = c.category_id
      LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
      LEFT JOIN style_variants sv ON s.style_number = sv.style_number AND sv.is_active = 1
      WHERE s.approved = 'yes' 
      AND s.company_code = ?
      GROUP BY s.style_id, s.style_number, s.name, s.description, s.category_id, s.image
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

  //get product details
  getProductDetails: (req, res) => {
    const { style_id } = req.params;
    const { company_code } = req.query;

    // get all sizes from the sizes table
    const getAllSizesQuery = `
      SELECT size_id, size_name, size_order
      FROM sizes 
      WHERE company_code = ?
      ORDER BY size_order ASC
    `;

    db.query(getAllSizesQuery, [company_code], (err, allSizesResult) => {
      if (err) {
        console.error('Error fetching all sizes:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      // get product details with available variants
      const productDetailsQuery = `
        SELECT
          s.style_id,
          s.style_number,
          s.name,
          s.description,
          s.image,
          sv.sku,
          sv.sale_price,
          sv.offer_price,
          sv.material_id,
          sz.size_name,
          sz.size_id,
          sv.variant_id,
          c.color_name,
          c.color_code,
          c.color_id,
          m.material_name,
          m.description AS material_description
        FROM styles s
        LEFT JOIN style_variants sv ON s.style_number = sv.style_number AND sv.is_active = 1
        LEFT JOIN sizes sz ON sv.size_id = sz.size_id
        LEFT JOIN colors c ON sv.color_id = c.color_id
        LEFT JOIN materials m ON sv.material_id = m.material_id
        WHERE s.style_id = ? 
        AND s.company_code = ?
        AND s.approved = 'yes'
      `;

      db.query(productDetailsQuery, [style_id, company_code], (err, results) => {
        if (err) {
          console.error('Error fetching product details:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }

        // Get available sizes for this product
        const availableSizes = [...new Set(results.map(r => r.size_name).filter(Boolean))];
        const availableSizeIds = [...new Set(results.map(r => r.size_id).filter(Boolean))];

        // Create all sizes array with availability status
        const allSizesWithAvailability = allSizesResult.map(size => ({
          size_id: size.size_id,
          size_name: size.size_name,
          available: availableSizeIds.includes(size.size_id)
        }));

        // Create size-color mapping for available variants only
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
        const sale_price = product.sale_price;
        const materialInfo = results.find(r => r.material_id || r.material_name || r.material_description);

        res.json({
          style_id: product.style_id,
          style_number: product.style_number,
          name: product.name,
          sku: product.sku,
          description: product.description,
          sale_price,
          offer_price: product.offer_price,
          variant_id: product.variant_id,
          all_sizes: allSizesWithAvailability, // All sizes with availability status
          available_sizes: availableSizes, // Only available sizes
          available_colors: allColors, // All available colors
          colors_by_size: availableBySize, // Colors available for each size
          image: product.image,
          material: {
            material_id: materialInfo.material_id,
            material_name: materialInfo.material_name,
            material_description: materialInfo.material_description
          }
        });
      });
    });
  },
  
  getProductListings: (req, res) => {
    const { company_code } = req.query;

    if (!company_code) {
      return res.status(400).json({ error: 'Company code is required' });
    }

    const sql = `
      SELECT style_id, style_number, name, description, image 
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
        s.style_number,
        s.name,
        s.description,
        s.image
      FROM styles s
      WHERE (s.name LIKE ? OR s.description LIKE ? OR s.style_number LIKE ?)
      AND s.approved = 'yes'
      AND s.company_code = ?
      ORDER BY 
        CASE 
          WHEN s.name LIKE ? THEN 1
          WHEN s.style_number LIKE ? THEN 2
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
        style_number: item.style_number,
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
      sv.sale_price,
      sv.offer_price,
      COUNT(DISTINCT sv.variant_id) as variant_count,
      ROUND(((sv.sale_price - sv.offer_price) / sv.sale_price) * 100, 2) as discount_percentage
    FROM styles s
    LEFT JOIN categories c ON s.category_id = c.category_id
    LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
    INNER JOIN style_variants sv ON s.style_number = sv.style_number 
    WHERE sv.is_active = 1 
    AND sv.offer_price IS NOT NULL 
    AND sv.offer_price > 0
    AND s.approved = 'yes' 
    AND s.company_code = ?
    GROUP BY s.style_id, s.style_number, s.name, s.description, s.category_id, s.image
    ORDER BY discount_percentage DESC, s.created_at DESC
  `;

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error retrieving styles with offer price:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(200).json(results);
    });
  },


  // GET similar products by category (exclude current product)
getSimilarProducts: (req, res) => {
  const { style_id } = req.params;
  const { company_code } = req.query;

  if (!company_code) {
    return res.status(400).json({ error: 'Company code is required' });
  }

  // First, get the category of the current product
  const getCategoryQuery = `
    SELECT category_id 
    FROM styles 
    WHERE style_id = ? AND company_code = ?
  `;

  db.query(getCategoryQuery, [style_id, company_code], (err, categoryResult) => {
    if (err) {
      console.error('Error getting product category:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (categoryResult.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const categoryId = categoryResult[0].category_id;

    // Get similar products from the same category
    const similarProductsQuery = `
      SELECT 
        s.style_id,
        s.style_number,
        s.name,
        s.description,
        s.image,
        c.category_name,
        c.category_id,
        parent_cat.category_name as parent_category_name,
        sv.sale_price,
        sv.offer_price,
        COUNT(DISTINCT sv.variant_id) as variant_count
      FROM styles s
      LEFT JOIN categories c ON s.category_id = c.category_id
      LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
      LEFT JOIN style_variants sv ON s.style_number = sv.style_number AND sv.is_active = 1
      WHERE s.category_id = ? 
      AND s.style_id != ?
      AND s.approved = 'yes' 
      AND s.company_code = ?
      GROUP BY s.style_id, s.style_number, s.name, s.description, s.category_id, s.image
      ORDER BY s.created_at DESC
      LIMIT 8
    `;

    db.query(similarProductsQuery, [categoryId, style_id, company_code], (err, results) => {
      if (err) {
        console.error('Error retrieving similar products:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(200).json(results);
    });
  });
},

};

module.exports = productController;
