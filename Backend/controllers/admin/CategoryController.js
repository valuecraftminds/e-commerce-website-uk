const db = require('../../config/database');

class CategoryController {
  // Get all categories with subcategories
  static async getCategories(req, res) {
    try {
      const { company_code } = req.query;
      if (!company_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company code is required' 
        });
      }

      const sql = `
        SELECT 
          c1.category_id,
          c1.category_name,
          c1.parent_id,
          c2.category_name as parent_name
        FROM categories c1
        LEFT JOIN categories c2 ON c1.parent_id = c2.category_id
        WHERE c1.company_code = ?
        ORDER BY COALESCE(c1.parent_id, c1.category_id), c1.category_id
      `;

      const [results] = await db.query(sql, [company_code]);
      
      const categories = [];
      const categoryMap = {};

      results.forEach(row => {
        if (!row.parent_id) {
          categoryMap[row.category_id] = {
            category_id: row.category_id,
            category_name: row.category_name,
            subcategories: []
          };
          categories.push(categoryMap[row.category_id]);
        } else {
          if (categoryMap[row.parent_id]) {
            categoryMap[row.parent_id].subcategories.push({
              category_id: row.category_id,
              category_name: row.category_name,
              parent_id: row.parent_id
            });
          }
        }
      });

      return res.json({ success: true, categories });
      
    } catch (error) {
      console.error('Error in getCategories:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
  }

  // Get subcategories by parent ID
  static async getSubcategories(req, res) {
    try {
      const { parent_id } = req.params;
      const { company_code } = req.query;

      if (!company_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company code is required' 
        });
      }

      const sql = `
        SELECT category_id, category_name, parent_id 
        FROM categories 
        WHERE parent_id = ? AND company_code = ?
      `;

      const [results] = await db.query(sql, [parent_id, company_code]);
      return res.json({ 
        success: true, 
        subcategories: results 
      });

    } catch (error) {
      console.error('Error in getSubcategories:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching subcategories' 
      });
    }
  }

// Add new category (main or subcategory)
static async addCategory(req, res) {
  try {
    const { category_name, parent_id, company_code } = req.body;

    if (!category_name || !company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name and company code are required' 
      });
    }

    // Only check category limit when adding MAIN categories (parent_id is null)
    if (!parent_id) {
      const [[{ total_categories }]] = await db.query(
        'SELECT COUNT(*) as total_categories FROM categories WHERE company_code = ? AND parent_id IS NULL',
        [company_code]
      );

      const [[license]] = await db.query(
        'SELECT category_count FROM admin_license WHERE company_code = ?',
        [company_code]
      );

      const categoryLimit = license?.category_count || 0;

      if (total_categories >= categoryLimit) {
        return res.status(403).json({
          success: false,
          message: 'Main category limit reached. Please upgrade your license.'
        });
      }
    }

    // Check for duplicate (both main and subcategories)
    const [existingCategories] = await db.query(
      'SELECT category_id FROM categories WHERE company_code = ? AND category_name = ? AND (parent_id = ? OR (? IS NULL AND parent_id IS NULL))',
      [company_code, category_name, parent_id, parent_id]
    );

    if (existingCategories.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: parent_id 
          ? 'Subcategory with this name already exists under the selected parent'
          : 'Main category with this name already exists'
      });
    }

    // Insert new category
    const [insertResult] = await db.query(
      'INSERT INTO categories (company_code, category_name, parent_id) VALUES (?, ?, ?)',
      [company_code, category_name, parent_id || null]
    );

    return res.json({
      success: true,
      message: parent_id ? 'Subcategory added successfully' : 'Main category added successfully',
      category_id: insertResult.insertId
    });

  } catch (error) {
    console.error('Error in addCategory:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while adding category' 
    });
  }
}

  // Update existing category
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { category_name, parent_id } = req.body;

      if (!category_name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category name is required' 
        });
      }

      if (parent_id && parseInt(parent_id) === parseInt(id)) {
        return res.status(400).json({ 
          success: false, 
          message: 'A category cannot be its own parent' 
        });
      }

      // Check if parent exists
      if (parent_id) {
        const [[parent]] = await db.query(
          'SELECT category_id FROM categories WHERE category_id = ?',
          [parent_id]
        );
        
        if (!parent) {
          return res.status(400).json({ 
            success: false, 
            message: 'Parent category does not exist' 
          });
        }
      }

      // Check for duplicate name
      const [duplicates] = await db.query(
        `SELECT category_id FROM categories 
         WHERE category_name = ? 
         AND parent_id ${parent_id ? '= ?' : 'IS NULL'} 
         AND category_id != ?`,
        [category_name, ...(parent_id ? [parent_id] : []), id]
      );

      if (duplicates.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: parent_id 
            ? 'Category name already exists under this parent' 
            : 'Main category name already exists'
        });
      }

      // Perform update
      const [result] = await db.query(
        'UPDATE categories SET category_name = ?, parent_id = ? WHERE category_id = ?',
        [category_name, parent_id || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      return res.json({ 
        success: true, 
        message: 'Category updated successfully' 
      });

    } catch (error) {
      console.error('Error in updateCategory:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error updating category' 
      });
    }
  }

  // Delete category
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Check for subcategories
      const [[{ count }]] = await db.query(
        'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
        [id]
      );

      if (count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It has ${count} subcategories. Delete them first.`
        });
      }

      // Delete category
      const [result] = await db.query(
        'DELETE FROM categories WHERE category_id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      return res.json({ 
        success: true, 
        message: 'Category deleted successfully' 
      });

    } catch (error) {
      console.error('Error in deleteCategory:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error deleting category' 
      });
    }
  }
}

module.exports = CategoryController;