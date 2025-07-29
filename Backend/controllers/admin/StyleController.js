const db = require('../../config/database');

class StyleController {
  static async getStylesByParentCategory(req, res) {
    try {
      const { parentId } = req.params;
      
      if (!parentId || isNaN(parentId)) {
        return res.status(400).json({ success: false, message: 'Valid parent ID required' });
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
        WHERE (c.parent_id = ? OR c.category_id = ?) AND s.approved = 'yes'
        GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
        ORDER BY s.created_at DESC
      `;

      const [results] = await db.execute(sql, [parentId, parentId]);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error('Error retrieving styles by parent category:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getAllStyles(req, res) {
    try {
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
        GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
        ORDER BY s.created_at DESC
      `;

      const [results] = await db.execute(sql);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error('Error retrieving all styles:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getProductDetails(req, res) {
    try {
      const { style_id } = req.params;
      
      if (!style_id || isNaN(style_id)) {
        return res.status(400).json({ success: false, message: 'Valid style ID required' });
      }

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
        WHERE s.style_id = ? AND s.approved = 'yes'
      `;

      const [results] = await db.execute(sql, [style_id]);
      
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Group sizes and colors uniquely
      const sizes = [...new Set(results.map(r => r.size_name).filter(Boolean))];
      const colors = [...new Set(results.map(r => r.color_name).filter(Boolean))];
      const product = results[0];

      res.json({
        success: true,
        data: {
          style_id: product.style_id,
          style_code: product.style_code,
          name: product.name,
          description: product.description,
          price: product.price,
          available_sizes: sizes,
          available_colors: colors,
          image: product.image
        }
      });
    } catch (error) {
      console.error('Error fetching product details:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getProductListings(req, res) {
    try {
      const sql = `
        SELECT style_id, style_code, name, description, image 
        FROM styles 
        WHERE approved = 'yes'
        ORDER BY created_at DESC
      `;

      const [results] = await db.execute(sql);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error('Error retrieving product listings:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = StyleController;