const db = require('../../config/database');

class BannerController {
  // Get banners by main category for customer side
  static getBannersByCategory(req, res) {
    const { category_id } = req.params;
    const { company_code } = req.query;
    
    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
    }

    if (!category_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category ID is required' 
      });
    }

    const sql = `
      SELECT 
        cb.banner_id,
        cb.banner_url,
        cb.created_at,
        c.category_name,
        c.category_id
      FROM custom_banners cb
      INNER JOIN categories c ON cb.category_id = c.category_id
      WHERE cb.category_id = ? 
        AND cb.company_code = ? 
        AND c.parent_id IS NULL
      ORDER BY cb.created_at DESC
    `;

    db.query(sql, [category_id, company_code], (err, results) => {
      if (err) {
        console.error('Error fetching category banners:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching banners' 
        });
      }
      
      res.json({ 
        success: true, 
        banners: results,
        category_id: category_id
      });
    });
  }

  // Get banners by category name for customer side
  static getBannersByCategoryName(req, res) {
    const { category_name } = req.params;
    const { company_code } = req.query;
    
    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
    }

    if (!category_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name is required' 
      });
    }

    const sql = `
      SELECT 
        cb.banner_id,
        cb.banner_url,
        cb.created_at,
        c.category_name,
        c.category_id
      FROM custom_banners cb
      INNER JOIN categories c ON cb.category_id = c.category_id
      WHERE LOWER(c.category_name) = LOWER(?) 
        AND cb.company_code = ? 
        AND c.parent_id IS NULL
      ORDER BY cb.created_at DESC
    `;

    db.query(sql, [category_name, company_code], (err, results) => {
      if (err) {
        console.error('Error fetching category banners by name:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching banners' 
        });
      }
      
      res.json({ 
        success: true, 
        banners: results,
        category_name: category_name
      });
    });
  }

  // Get all banners for a company (for homepage or all categories view)
  static getAllBanners(req, res) {
    const { company_code } = req.query;
    
    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
    }

    const sql = `
      SELECT 
        cb.banner_id,
        cb.banner_url,
        cb.created_at,
        c.category_name,
        c.category_id
      FROM custom_banners cb
      INNER JOIN categories c ON cb.category_id = c.category_id
      WHERE cb.company_code = ? 
        AND c.parent_id IS NULL
      ORDER BY c.category_name ASC, cb.created_at DESC
    `;

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error fetching all banners:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching banners' 
        });
      }
      
      // Group banners by category
      const bannersByCategory = results.reduce((acc, banner) => {
        const categoryName = banner.category_name;
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(banner);
        return acc;
      }, {});
      
      res.json({ 
        success: true, 
        banners: results,
        bannersByCategory: bannersByCategory
      });
    });
  }
}

module.exports = BannerController;